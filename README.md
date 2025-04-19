# commit-sync

# Overview

The Heatmap API generates a self‑contained SVG representing your activity for the current month, combining: - GitHub commits (via the Search API) - GitLab events - A GitHub‑style calendar grid - A month/year header, total‑event count, and a “Less … More” legend

All you need is to call:

```http
GET /api/heatmap?github=<GH_USERNAME>&gitlab=<GL_USERNAME>&mode=<light|dark>&bg=%<HEX_COLOR>
```

To get SVG image of your git heatmap.

## Endpoint

```http
GET /api/heatmap
Host: your-domain.com
```

Response:

- 200 OK
- `Content-Type: image/svg+xml`
- No caching (headers: `Cache-Control: no-cache, no store, must-revalidate)¨

## Query Parameters

| Parameter | Type   | ?Required | Default        | Description       |
| --------- | ------ | --------- | -------------- | ----------------- |
| github    | string | No        | ""             | Github username   |
| gitlab    | string | No        | ""             | Gitlab username   |
| mode      | string | No        | "light"        | "light" or "dark" |
| bg        | hex    | No        | Light: #f4f8d3 |
|           |        |           | Dark: #0a0a0a  |

At least one of `github` or `gitlab` must be non-empty for any activity to appear. Empty names simply skip the corresponding service.

## How it works

1. Date range
   - Automatically set to the first day of this month throught today
2. Github Commits
   - Uses the Search Commits API:
   ```http
       GET https://api.github.com/search/commits
       ?q=author:<githubUsername> committer-date:<start>..<end>
       &per_page=100
       Accept: application/vnd.github.cloak-preview
       Authorization: token YOUR_GITHUB_API_KEY
   ```
   - Counts each returned commit
3. Gitlab Events
   - Fetches the user by name, then their `/events?per_page=100` feed
   - Counts each event occurrence
4. Aggregation
   - Creates a day-keyed map (`YYYY-MM-DD`) initialized to zero for every day of the month.
   - Increments the count for each commit/event
5. SVG Rendering
   - Header: `April 2025 37 events`
   - Legend: Less [□][□][□][□][□] More
   - Grid: Weeks \* 7, each cell sized 30x30 pixels (with 2 pixels gaps), colored via `getColor(count, darkMode)` and labeled with the day number.

## Usage examples

### Light mode (default bg)

```html
<img src="/api/heatmap?github=octocat&gitlab=octocat" alt="My April Activity" />
```

### Dark mode with custom background

```html
<img
  src="/api/heatmap?
     github=octocat
     &gitlab=octocat
     &mode=dark
     &bg=%23111111"  <!-- note: URL‑encode “#” as “%23” -->
  alt="My April Activity (dark)"
/>
```

### Only GitHub

```html
<img src="/api/heatmap?github=octocat" alt="GitHub only heatmap" />
```

###### Thanks if you read this far, I really appreciate it. It means a lot to me.
