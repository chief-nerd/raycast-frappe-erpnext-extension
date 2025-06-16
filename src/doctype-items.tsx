import React, { useState, useEffect } from "react";
import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  Detail,
} from "@raycast/api";
import { erpNextAPI } from "./api";
import { DocType, DocTypeItem } from "./types";

interface DocTypeItemsViewProps {
  docType: DocType;
}

export function DocTypeItemsView({ docType }: DocTypeItemsViewProps) {
  const [items, setItems] = useState<DocTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        if (searchText.trim()) {
          const searchResults = await erpNextAPI.searchDocTypeItems(
            docType.name,
            searchText,
          );
          setItems(searchResults);
        } else {
          const allItems = await erpNextAPI.getDocTypeItems(docType.name, 50);
          setItems(allItems);
        }
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: `Failed to fetch ${docType.name} items`,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [docType.name, searchText]);

  const renderItemDetail = (item: DocTypeItem) => {
    const markdown = `# ${item.name}\n\n${Object.entries(item)
      .filter(([key]) => key !== "name")
      .map(([key, value]) => `**${key}**: ${value || "—"}`)
      .join("\n\n")}`;

    return (
      <Detail
        markdown={markdown}
        navigationTitle={`${docType.name}: ${item.name}`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Open in ERPNext"
              icon={Icon.Globe}
              url={erpNextAPI.getDocumentURL(docType.name, item.name)}
            />
            <Action.CopyToClipboard
              title="Copy Document Name"
              content={item.name}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          </ActionPanel>
        }
      />
    );
  };

  return (
    <List
      isLoading={loading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={`Search ${docType.name} items...`}
      navigationTitle={`${docType.name} Items`}
      throttle
    >
      {items.map((item) => (
        <List.Item
          key={item.name}
          title={item.name}
          subtitle={getItemSubtitle(item)}
          icon={Icon.Document}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                icon={Icon.Eye}
                target={renderItemDetail(item)}
              />
              <Action.OpenInBrowser
                title="Open in ERPNext"
                icon={Icon.Globe}
                url={erpNextAPI.getDocumentURL(docType.name, item.name)}
              />
              <Action.OpenInBrowser
                title="Create New Document"
                icon={Icon.Plus}
                url={erpNextAPI.getNewDocumentURL(docType.name)}
              />
              <Action.CopyToClipboard
                title="Copy Document Name"
                content={item.name}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!loading && items.length === 0 && (
        <List.EmptyView
          title={`No ${docType.name} Items Found`}
          description={
            searchText
              ? "Try adjusting your search"
              : "This DocType has no items yet"
          }
          icon={Icon.Document}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title="Create New Document"
                icon={Icon.Plus}
                url={erpNextAPI.getNewDocumentURL(docType.name)}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

function getItemSubtitle(item: DocTypeItem): string {
  // Try to find meaningful fields for subtitle
  const possibleSubtitleFields = [
    "title",
    "subject",
    "description",
    "status",
    "customer",
    "supplier",
    "item_name",
    "full_name",
    "email",
  ];

  for (const field of possibleSubtitleFields) {
    if (item[field] && typeof item[field] === "string") {
      return item[field];
    }
  }

  // If no meaningful subtitle found, show creation date or empty
  return item.creation
    ? `Created: ${new Date(item.creation).toLocaleDateString()}`
    : "";
}
