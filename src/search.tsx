import React, { useState, useEffect } from "react";
import {
	List,
	ActionPanel,
	Action,
	showToast,
	Toast,
	Icon,
	Color,
	Detail,
} from "@raycast/api";
import { erpNextAPI } from "./api";
import { DocTypeItem } from "./types";

interface SearchArguments {
	query: string;
	doctype?: string;
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

function DocumentDetail({ doctype, name }: { doctype: string; name: string }) {
	const [document, setDocument] = useState<DocTypeItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchDocument() {
			try {
				setLoading(true);
				const doc = await erpNextAPI.getDocumentDetail(doctype, name);
				setDocument(doc);
			} catch (error) {
				console.error("Error fetching document:", error);
				setError(error instanceof Error ? error.message : "Failed to fetch document");
				showToast({
					style: Toast.Style.Failure,
					title: "Failed to load document",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			} finally {
				setLoading(false);
			}
		}

		fetchDocument();
	}, [doctype, name]);

	if (loading) {
		return <Detail isLoading={true} navigationTitle={`Loading ${name}...`} />;
	}

	if (error || !document) {
		return (
			<Detail
				markdown={`# Error Loading Document

**Error:** ${error || "Document not found"}

Please try again or check your connection to ERPNext.`}
				navigationTitle="Error"
				actions={
					<ActionPanel>
						<Action.OpenInBrowser
							title="Open in Erpnext"
							icon={Icon.Globe}
							url={erpNextAPI.getDocumentURL(doctype, name)}
						/>
					</ActionPanel>
				}
			/>
		);
	}

	// Format the document data for display
	const formatValue = (value: unknown): string => {
		if (value === null || value === undefined) return "—";
		if (typeof value === "boolean") return value ? "Yes" : "No";
		if (typeof value === "object") return JSON.stringify(value, null, 2);
		if (typeof value === "string" && value.includes("T") && value.includes(":")) {
			// Likely a datetime string
			try {
				return new Date(value).toLocaleString();
			} catch {
				return value;
			}
		}
		return String(value);
	};

	// Group fields by importance and create nice display
	const importantFields = ["status", "docstatus", "owner", "creation", "modified"];
	const standardFields = Object.keys(document).filter(
		key => !importantFields.includes(key) &&
			!key.startsWith("_") &&
			document[key] !== null &&
			document[key] !== undefined &&
			document[key] !== ""
	);

	// Create metadata from important fields
	const metadata = importantFields
		.filter(field => document[field] !== undefined && document[field] !== null && document[field] !== "")
		.reduce((acc, field) => {
			const label = field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
			acc[label] = formatValue(document[field]);
			return acc;
		}, {} as Record<string, string>);

	// Create sections for better organization
	const createSection = (title: string, fields: string[]) => {
		const sectionContent = fields
			.filter(field => document[field] !== undefined && document[field] !== null && document[field] !== "")
			.map(field => {
				const label = field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
				return `**${label}:** ${formatValue(document[field])}`;
			})
			.join("  \n");

		return sectionContent ? `## ${title}\n${sectionContent}\n` : "";
	};

	const markdown = `# ${document.name || name}

${createSection("Fields", standardFields)}
`;

	return (
		<Detail
			markdown={markdown}
			navigationTitle={`${doctype}: ${document.name || name}`}
			metadata={
				<Detail.Metadata>
					<Detail.Metadata.Label title="DocType" text={doctype} />
					{Object.entries(metadata).map(([key, value]) => (
						<Detail.Metadata.Label key={key} title={key} text={value} />
					))}
				</Detail.Metadata>
			}
			actions={
				<ActionPanel>
					<Action.OpenInBrowser
						title="Open in Erpnext"
						icon={Icon.Globe}
						url={erpNextAPI.getDocumentURL(doctype, document.name || name)}
					/>
					<Action.OpenInBrowser
						title="Edit in Erpnext"
						icon={Icon.Pencil}
						url={erpNextAPI.getDocumentURL(doctype, document.name || name)}
						shortcut={{ modifiers: ["cmd"], key: "e" }}
					/>
					<Action.CopyToClipboard
						title="Copy Document Name"
						content={document.name || name}
						shortcut={{ modifiers: ["cmd"], key: "c" }}
					/>
					<Action.CopyToClipboard
						title="Copy Doctype"
						content={doctype}
						shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
					/>
					<Action.CopyToClipboard
						title="Copy Document JSON"
						content={JSON.stringify(document, null, 2)}
						shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
					/>
				</ActionPanel>
			}
		/>
	);
}

export default function Command(props: { arguments: SearchArguments }) {
	const searchQuery = props.arguments?.query || "";
	const doctypeFilter = props.arguments?.doctype || "";
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
				const results = await erpNextAPI.globalSearch(searchText, doctypeFilter);
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
	}, [searchText, doctypeFilter]);

	const getDocTypeFromDescription = (description: string) => {
		// The description typically has format "DocType: Some description"
		const match = description.match(/^([^:]+):/);
		return match ? match[1].trim() : "Unknown";
	};

	const getDocTypeFromResult = (result: SearchResult) => {
		// Priority order: direct doctype field, extract from description, fallback to "Unknown"
		if (result.doctype && typeof result.doctype === 'string' && result.doctype.trim()) {
			return result.doctype.trim();
		}

		if (result.description && typeof result.description === 'string') {
			const extractedDocType = getDocTypeFromDescription(result.description);
			if (extractedDocType !== "Unknown") {
				return extractedDocType;
			}
		}

		// Last resort: check if any other field might contain doctype info
		const possibleDocTypeFields = ['dt', 'document_type', 'type'];
		for (const field of possibleDocTypeFields) {
			if (result[field] && typeof result[field] === 'string' && result[field] !== '') {
				return String(result[field]).trim();
			}
		}

		return "Document";
	};

	const getDocumentName = (result: SearchResult) => {
		// Priority order: name field, value field, title field, fallback to "Unknown"
		if (result.name && typeof result.name === 'string' && result.name.trim()) {
			return result.name.trim();
		}

		if (result.value && typeof result.value === 'string' && result.value.trim()) {
			return result.value.trim();
		}

		if (result.title && typeof result.title === 'string' && result.title.trim()) {
			return result.title.trim();
		}

		return "Unknown Document";
	};

	const getDisplayLabel = (result: SearchResult) => {
		// Priority order: label field, title field, name field, value field
		if (result.label && typeof result.label === 'string' && result.label.trim()) {
			return result.label.trim();
		}

		if (result.title && typeof result.title === 'string' && result.title.trim()) {
			return result.title.trim();
		}

		return getDocumentName(result);
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
			searchBarPlaceholder={doctypeFilter ? `Search ${doctypeFilter} documents...` : "Search ERPNext..."}
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
					title={doctypeFilter ? `Search ${doctypeFilter}` : "Type to search"}
					description={doctypeFilter ? `Enter your search query to find ${doctypeFilter} documents` : "Enter your search query to find DocTypes, documents, and more"}
					icon={Icon.MagnifyingGlass}
				/>
			) : searchResults.length === 0 && !isLoading ? (
				<List.EmptyView
					title="No Results Found"
					description={doctypeFilter ? `No ${doctypeFilter} documents found. Try different keywords.` : "Try searching with different keywords"}
					icon={Icon.MagnifyingGlass}
				/>
			) : (
				searchResults.map((result, index) => {
					const docType = getDocTypeFromResult(result);
					const documentName = getDocumentName(result);
					const displayLabel = getDisplayLabel(result);
					const displayTitle = `[${docType}] ${displayLabel}`;

					return (
						<List.Item
							key={`${docType}-${documentName}-${index}`}
							title={displayTitle}
							subtitle={result.content || result.description || ""}
							icon={getIconForResult(result)}
							actions={
								<ActionPanel>
									<Action.Push
										title="View Details"
										icon={Icon.Eye}
										target={<DocumentDetail doctype={docType} name={documentName} />}
									/>
									<Action.OpenInBrowser
										title="Open in Erpnext"
										icon={Icon.Globe}
										url={erpNextAPI.getDocumentURL(docType, documentName)}
									/>
									<Action.CopyToClipboard
										title="Copy Document Name"
										content={documentName}
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
