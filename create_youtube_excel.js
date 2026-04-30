const XLSX = require('xlsx');

const headers = [
    "Change ID", "Scenario Number", "Scenario Name - Script Name", "Expected Result", "Condition",
    "Application", "Complexity", "TF", "TF Reason", "Automation", "Automation Reason",
    "Due Date", "Prerequisites", "Test Data"
];

const data = [
    headers,
    [null, "A", "YouTube Basic Interactions"],
    ["YT001", "A.1", "Search for a video", "Video list is displayed", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, "searchTerm=Playwright Tutorial"],
    [null, 1, "Navigate to YouTube", "YouTube home page loaded", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Input search term", "Search bar contains text", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, "searchTerm=Playwright Tutorial"],
    [null, 3, "Click search button", "Search results page loaded", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    
    ["YT002", "A.2", "Filter by This Week", "Results are filtered", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Click filter button", "Filter menu opens", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Select This Week", "Results updated", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT003", "A.3", "Click first video", "Video starts playing", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Select first video result", "Video page loaded", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT004", "A.4", "Like the video", "Like count increases", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, "LoggedIn", null],
    [null, 1, "Click like button", "Like icon changes state", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT005", "A.5", "Subscribe to channel", "Subscribed status shown", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, "LoggedIn", null],
    [null, 1, "Click subscribe button", "Button text changes to Subscribed", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT006", "B.1", "Search no results", "No results message shown", "Negative", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, "searchTerm=asdfghjkl1234567890"],
    [null, 1, "Input invalid search term", "Search bar contains text", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, "searchTerm=asdfghjkl1234567890"],
    [null, 2, "Click search button", "No results page shown", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT007", "B.2", "Filter by Playlist", "Only playlists are shown", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Click filter button", "Filter menu opens", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Select Playlist type", "Results updated to playlists", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],

    ["YT008", "B.3", "Change theme", "Theme changes", "Normal", "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Click profile/menu", "Menu opens", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Click appearance", "Theme options show", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 3, "Select Dark theme", "UI changes to dark mode", null, "YouTube Web", "Low", "No", null, "Yes", null, 46118, null, null]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Scenarios");
XLSX.writeFile(wb, "youtube_scenario.xlsx");
console.log("✅ Created youtube_scenario.xlsx");
