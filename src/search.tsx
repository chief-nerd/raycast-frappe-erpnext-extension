import React, { useState, useEffect } from "react";
import {
	List,
	ActionPanel,
	Action,
	showToast,
	Toast,
	Icon,
	Color,
} from "@raycast/api";
import { erpNextAPI } from "./api";

interface SearchArguments {
	query: string;
}

interface SearchResult {
	value: string;  // This is the document name
	label?: string; // Optional label field
	description: string; // This contains the DocType and content
	doctype?: string; // DocType field from API response
	name?: string; // Name field from API response
	title?: string; // Title field from API response
	content?: string; // Content field from API response
	[key: string]: string | number | boolean | undefined; // Additional fields from the API response
}

export default function Command(props: { arguments: SearchArguments }) {
	const searchQuery = props.arguments?.query || "";
	const [searchText, setSearchText] = useState(searchQuery);
	const [isLoading, setIsLoading] = useState(true);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchSearchResults = async () => {
			if (!searchText.trim()) {
				setSearchResults([]);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const results = await erpNextAPI.globalSearch(searchText);
				const searchResults: SearchResult[] = results.map((item) => {
					return {
						value: item.name || item.title || "Unknown",
						label: item.title || item.name || "Unknown",
						description: `${item.doctype}: ${item.content || item.description || ""}`,
						...item, // Include any other fields returned by the API
					};
				});
				setSearchResults(searchResults);
			} catch (error) {
				console.error("Search error:", error);
				setError(error instanceof Error ? error.message : "Unknown error");
				showToast({
					style: Toast.Style.Failure,
					title: "Search failed",
					message: error instanceof Error ? error.message : "An unknown error occurred",
				});
			} finally {
				setIsLoading(false);
			}
		};

		// Debounce search to avoid too many API calls
		const timer = setTimeout(() => {
			fetchSearchResults();
		}, 500);

		return () => clearTimeout(timer);
	}, [searchText]);

	const getDocTypeFromDescription = (description: string) => {
		// The description typically has format "DocType: Some description"
		const match = description.match(/^([^:]+):/);
		return match ? match[1].trim() : "Unknown";
	};

	const getDocTypeFromResult = (result: SearchResult) => {
		return result.doctype || getDocTypeFromDescription(result.description);
	};

	const getIconForResult = (result: SearchResult) => {
		const doctype = getDocTypeFromResult(result);

		// Customize icons based on DocType
		switch (doctype) {
			case "Sales Invoice":
			case "Purchase Invoice":
				return { source: Icon.Coin, tintColor: Color.Green };
			case "Item":
				return { source: Icon.Box, tintColor: Color.Orange };
			case "ToDo":
				return { source: Icon.Check, tintColor: Color.Purple };
			case "Customer":
			case "Supplier":
				return { source: Icon.ArrowNe, tintColor: Color.Magenta };
			case "DocType":
				return { source: Icon.Cog, tintColor: Color.Red };
			case "Contact":
			case "Employee":
				return { source: Icon.Person, tintColor: Color.Yellow };
			default:
				return { source: Icon.Document, tintColor: Color.Blue };
		}
	};

	return (
		<List
			isLoading={isLoading}
			searchText={searchText}
			onSearchTextChange={setSearchText}
			searchBarPlaceholder="Search ERPNext..."
			throttle
		>
			{error ? (
				<List.EmptyView
					title="Error"
					description={error}
					icon={{ source: Icon.Warning, tintColor: Color.Red }}
				/>
			) : searchText.trim() === "" ? (
				<List.EmptyView
					title="Type to search"
					description="Enter your search query to find DocTypes, documents, and more"
					icon={Icon.MagnifyingGlass}
				/>
			) : searchResults.length === 0 && !isLoading ? (
				<List.EmptyView
					title="No Results Found"
					description="Try searching with different keywords"
					icon={Icon.MagnifyingGlass}
				/>
			) : (
				searchResults.map((result, index) => {
					const docType = getDocTypeFromResult(result);
					const baseName = result.label || result.value;
					const displayName = `[${docType}] ${baseName}`;

					return (
						<List.Item
							key={`${docType}-${result.value}-${index}`}
							title={displayName}
							subtitle={result.content || result.description || ""}
							icon={getIconForResult(result)}
							actions={
								<ActionPanel>
									<Action.OpenInBrowser
										title="Open in Erpnext"
										url={erpNextAPI.getDocumentURL(docType, result.name || result.value)}
									/>
									<Action.CopyToClipboard
										title="Copy Document Name"
										content={result.name || result.value}
										shortcut={{ modifiers: ["cmd"], key: "c" }}
									/>
									<Action.CopyToClipboard
										title="Copy Doctype"
										content={docType}
										shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
									/>
								</ActionPanel>
							}
						/>
					);
				})
			)}
		</List>
	);
}
