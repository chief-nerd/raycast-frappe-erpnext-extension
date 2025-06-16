# Raycast ERPNext Extension

A powerful Raycast extension that integrates with Frappe ERPNext, allowing you to:

- **Search and browse DocTypes**: Query all available DocTypes in your ERPNext instance
- **View DocType items**: Browse and search through documents within any DocType  
- **Create new documents**: Quickly open the ERPNext form to create new documents
- **Quick navigation**: Jump between DocTypes and documents seamlessly

## Features

### 🔍 Search DocTypes
- Browse all available DocTypes in your ERPNext instance
- Filter by name with instant search
- Visual indicators for custom and submittable DocTypes
- Quick access to create new documents

### 📋 View Items
- Browse items within any selected DocType
- Search functionality for finding specific documents
- Detailed view showing all document fields
- Direct links to open documents in ERPNext

### ⚡ Quick Actions
- Create new documents with one click
- Copy document names to clipboard
- Open documents directly in your ERPNext web interface

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure ERPNext Connection
The extension requires API credentials from your ERPNext instance. You'll need:

- **ERPNext URL**: The base URL of your ERPNext instance (e.g., `https://your-company.erpnext.com`)
- **API Key**: Your ERPNext API Key
- **API Secret**: Your ERPNext API Secret

### 3. Generate API Credentials in ERPNext

1. Log into your ERPNext instance
2. Go to **User** > **API Secret** 
3. Click **Generate Keys** or create new API credentials
4. Copy the **API Key** and **API Secret**

### 4. Install the Extension
```bash
npm run build
```

Then add the extension to Raycast by importing the built extension.

### 5. Configure Extension Preferences
In Raycast:
1. Open the extension settings
2. Enter your ERPNext URL, API Key, and API Secret
3. Save the configuration

## Usage

### Search DocTypes
1. Open Raycast
2. Type "Search DocTypes" or use the command directly
3. Browse or search through available DocTypes
4. Press Enter or ⌘+Enter to view items

### View Documents
1. Select a DocType from the list
2. Browse through documents or use search to filter
3. Press Enter to view document details
4. Use ⌘+O to open in ERPNext web interface

### Create New Documents
- From DocType list: Select "Create New Document" action
- From items view: Use "Create New Document" action
- Opens ERPNext form in your default browser

## Keyboard Shortcuts

- **⌘+C**: Copy document/DocType name
- **⌘+O**: Open in ERPNext (when available)
- **⌘+←**: Navigate back
- **Enter**: View details/items

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

## Troubleshooting

### Common Issues

**"Failed to fetch DocTypes"**
- Verify your ERPNext URL is correct and accessible
- Check that your API credentials are valid
- Ensure your ERPNext instance allows API access

**"No items found"**
- Some DocTypes may be empty or restricted
- Check permissions for the DocType in ERPNext
- Verify your user has read access to the DocType

**Connection timeout**
- Check your internet connection
- Verify ERPNext server is responsive
- Consider if your ERPNext instance requires VPN access

## License

MIT License - see LICENSE file for details.