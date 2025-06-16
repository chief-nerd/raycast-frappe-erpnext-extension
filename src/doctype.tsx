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
import { DocType } from "./types";
import { DocTypeItemsView } from "./doctype-items";

export default function Command() {
	const [docTypes, setDocTypes] = useState<DocType[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchText, setSearchText] = useState("");

	useEffect(() => {
		async function fetchDocTypes() {
			try {
				setLoading(true);
				const types = await erpNextAPI.getDocTypes();
				setDocTypes(types);
			} catch (error) {
				showToast({
					style: Toast.Style.Failure,
					title: "Failed to fetch DocTypes",
					message:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			} finally {
				setLoading(false);
			}
		}

		fetchDocTypes();
	}, []);

	const filteredDocTypes = docTypes.filter((docType) =>
		docType.name.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<List
			isLoading={loading}
			onSearchTextChange={setSearchText}
			searchBarPlaceholder="Search DocTypes..."
			throttle
		>
			{filteredDocTypes.map((docType) => (
				<List.Item
					key={docType.name}
					title={docType.name}
					subtitle={docType.module}
					accessories={[
						...(docType.custom
							? [{ text: "Custom", icon: Icon.Gear, tooltip: "Custom DocType" }]
							: []),
						...(docType.is_submittable
							? [
								{
									text: "Submittable",
									icon: Icon.CheckCircle,
									tooltip: "Submittable DocType",
								},
							]
							: []),
					]}
					icon={{
						source: Icon.Document,
						tintColor: docType.custom ? Color.Orange : Color.Blue,
					}}
					actions={
						<ActionPanel>
							<Action.Push
								title="View Items"
								icon={Icon.List}
								target={<DocTypeItemsView docType={docType} />}
							/>
							<Action.OpenInBrowser
								title="Create New Document"
								icon={Icon.Plus}
								url={erpNextAPI.getNewDocumentURL(docType.name)}
							/>
							<Action.CopyToClipboard
								title="Copy DocType Name"
								content={docType.name}
								shortcut={{ modifiers: ["cmd"], key: "c" }}
							/>
						</ActionPanel>
					}
				/>
			))}
			{!loading && filteredDocTypes.length === 0 && (
				<List.EmptyView
					title="No DocTypes Found"
					description="Try adjusting your search or check your ERPNext connection"
					icon={Icon.MagnifyingGlass}
				/>
			)}
		</List>
	);
}
