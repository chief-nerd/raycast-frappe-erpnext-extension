import { Icon, Color } from "@raycast/api";

export interface SearchResult {
	value: string;
	label?: string;
	description: string;
	doctype?: string;
	name?: string;
	title?: string;
	content?: string;
	[key: string]: string | number | boolean | undefined;
}

/**
 * Extracts DocType from description string that follows format "DocType: content"
 */
export const getDocTypeFromDescription = (description: string): string => {
	const match = description.match(/^([^:]+):/);
	return match ? match[1].trim() : "Unknown";
};

/**
 * Determines the DocType of a search result using multiple fallback strategies
 */
export const getDocTypeFromResult = (result: SearchResult): string => {
	// Priority 1: Direct doctype field
	if (result.doctype && typeof result.doctype === 'string' && result.doctype.trim()) {
		return result.doctype.trim();
	}

	// Priority 2: Extract from description
	if (result.description && typeof result.description === 'string') {
		const extractedDocType = getDocTypeFromDescription(result.description);
		if (extractedDocType !== "Unknown") {
			return extractedDocType;
		}
	}

	// Priority 3: Check alternative field names
	const possibleDocTypeFields = ['dt', 'document_type', 'type'];
	for (const field of possibleDocTypeFields) {
		if (result[field] && typeof result[field] === 'string' && result[field] !== '') {
			return String(result[field]).trim();
		}
	}

	return "Document";
};

/**
 * Gets the document name from a search result using field priority
 */
export const getDocumentName = (result: SearchResult): string => {
	const fields = ['name', 'value', 'title'];

	for (const field of fields) {
		if (result[field] && typeof result[field] === 'string' && result[field].trim()) {
			return String(result[field]).trim();
		}
	}

	return "Unknown Document";
};

/**
 * Gets the display label for a search result
 */
export const getDisplayLabel = (result: SearchResult): string => {
	const fields = ['label', 'title'];

	for (const field of fields) {
		if (result[field] && typeof result[field] === 'string' && result[field].trim()) {
			return String(result[field]).trim();
		}
	}

	return getDocumentName(result);
};

/**
 * Returns appropriate icon and color for a given DocType
 */
export const getIconForResult = (result: SearchResult): { source: Icon; tintColor: Color } => {
	const doctype = getDocTypeFromResult(result);

	const iconMap: Record<string, { source: Icon; tintColor: Color }> = {
		"Sales Invoice": { source: Icon.Coin, tintColor: Color.Green },
		"Purchase Invoice": { source: Icon.Coin, tintColor: Color.Green },
		"Item": { source: Icon.Box, tintColor: Color.Orange },
		"ToDo": { source: Icon.Check, tintColor: Color.Purple },
		"Customer": { source: Icon.Person, tintColor: Color.Magenta },
		"Supplier": { source: Icon.Person, tintColor: Color.Magenta },
		"DocType": { source: Icon.Cog, tintColor: Color.Red },
		"Contact": { source: Icon.Person, tintColor: Color.Yellow },
		"Employee": { source: Icon.Person, tintColor: Color.Yellow },
	};

	return iconMap[doctype] || { source: Icon.Document, tintColor: Color.Blue };
};