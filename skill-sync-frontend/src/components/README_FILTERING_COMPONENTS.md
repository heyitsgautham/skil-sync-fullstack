# Advanced Filtering Components

This directory contains reusable React components for implementing advanced filtering, sorting, and pagination functionality across the SkillSync application.

## Components

### 1. FilterPanel.js

A collapsible filter panel component with various filter types.

**Features:**
- Collapsible interface with expand/collapse animation
- Active filter count badge
- Match score range slider
- Multi-select skills dropdown
- Experience range slider
- Education level dropdown
- Location text input
- Application status dropdown
- Days posted dropdown
- Clear all filters button
- Sticky positioning support

**Usage:**
```javascript
import FilterPanel from '../components/FilterPanel';

<FilterPanel
  filters={filters}
  onFilterChange={handleFilterChange}
  onClear={handleClearFilters}
  availableSkills={['Python', 'React', 'Node.js']}
  showExperience={true}
  showEducation={true}
  showLocation={true}
  showApplicationStatus={false}
  showDaysPosted={true}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filters` | Object | Yes | - | Current filter values |
| `onFilterChange` | Function | Yes | - | Callback when filters change |
| `onClear` | Function | Yes | - | Callback to clear all filters |
| `availableSkills` | Array | No | `[]` | Skills for multi-select |
| `showExperience` | Boolean | No | `true` | Show experience filter |
| `showEducation` | Boolean | No | `false` | Show education filter |
| `showLocation` | Boolean | No | `false` | Show location filter |
| `showApplicationStatus` | Boolean | No | `false` | Show application status |
| `showDaysPosted` | Boolean | No | `false` | Show days posted filter |

**Filter Object Structure:**
```javascript
{
  minScore: 0,              // 0-100
  maxScore: 100,            // 0-100
  skills: [],               // Array of strings
  experienceMin: 0,         // Years
  experienceMax: 10,        // Years
  educationLevel: '',       // String
  location: '',             // String
  applicationStatus: '',    // pending | accepted | rejected
  daysPosted: ''            // Number (7, 14, 30, 60)
}
```

---

### 2. PaginationControls.js

A pagination component with page size selector and total count display.

**Features:**
- Material-UI Pagination component
- Configurable page size dropdown
- Total results count
- First/Last page navigation
- Responsive design

**Usage:**
```javascript
import PaginationControls from '../components/PaginationControls';

<PaginationControls
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  total={total}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `page` | Number | Yes | `1` | Current page number |
| `totalPages` | Number | Yes | `1` | Total number of pages |
| `pageSize` | Number | Yes | `10` | Items per page |
| `total` | Number | Yes | `0` | Total number of items |
| `onPageChange` | Function | Yes | - | Callback when page changes |
| `onPageSizeChange` | Function | Yes | - | Callback when page size changes |
| `pageSizeOptions` | Array | No | `[10, 25, 50, 100]` | Available page sizes |

---

### 3. SortControls.js

A sorting component with field selector and order toggle.

**Features:**
- Sort field dropdown
- Sort order toggle buttons
- Ascending/Descending icons
- Configurable sort options

**Usage:**
```javascript
import SortControls from '../components/SortControls';

<SortControls
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSortChange={handleSortChange}
  sortOptions={[
    { value: 'score', label: 'Match Score' },
    { value: 'date', label: 'Date' },
    { value: 'title', label: 'Title' }
  ]}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `sortBy` | String | Yes | `'score'` | Current sort field |
| `sortOrder` | String | Yes | `'desc'` | Current sort order |
| `onSortChange` | Function | Yes | - | Callback when sort changes |
| `sortOptions` | Array | Yes | - | Available sort options |

**Sort Options Structure:**
```javascript
[
  { value: 'score', label: 'Match Score' },
  { value: 'date', label: 'Date Posted' },
  { value: 'title', label: 'Title' }
]
```

**onSortChange Callback:**
```javascript
const handleSortChange = ({ sortBy, sortOrder }) => {
  setSortBy(sortBy);
  setSortOrder(sortOrder);
};
```

---

## Complete Implementation Example

Here's a complete example of using all three components together:

```javascript
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import SortControls from '../components/SortControls';
import PaginationControls from '../components/PaginationControls';
import apiClient from '../services/api';

const MyFilteredPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize')) || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    minScore: parseInt(searchParams.get('minScore')) || 0,
    maxScore: parseInt(searchParams.get('maxScore')) || 100,
    skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
    experienceMin: parseFloat(searchParams.get('experienceMin')) || 0,
    experienceMax: parseFloat(searchParams.get('experienceMax')) || 10,
    location: searchParams.get('location') || '',
  });
  
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'score');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('pageSize', pageSize);
    if (filters.minScore > 0) params.set('minScore', filters.minScore);
    if (filters.maxScore < 100) params.set('maxScore', filters.maxScore);
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    setSearchParams(params, { replace: true });
  }, [page, pageSize, filters, sortBy, sortOrder]);
  
  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters, sortBy, sortOrder]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      // Add filters
      if (filters.minScore > 0) params.min_score = filters.minScore;
      if (filters.maxScore < 100) params.max_score = filters.maxScore;
      if (filters.skills.length > 0) params.skills = filters.skills.join(',');
      
      const response = await apiClient.get('/your-endpoint', { params });
      
      setResults(response.data.items);
      setTotal(response.data.total);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };
  
  const handleClearFilters = () => {
    setFilters({
      minScore: 0,
      maxScore: 100,
      skills: [],
      experienceMin: 0,
      experienceMax: 10,
      location: '',
    });
    setPage(1);
  };
  
  const handleSortChange = ({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };
  
  return (
    <div>
      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        availableSkills={['Python', 'React', 'Node.js']}
        showExperience={true}
        showLocation={true}
      />
      
      {/* Sort */}
      <SortControls
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'score', label: 'Match Score' },
          { value: 'date', label: 'Date' },
          { value: 'title', label: 'Title' }
        ]}
      />
      
      {/* Results */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {results.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default MyFilteredPage;
```

---

## Styling Guidelines

All components use Material-UI's theming system and follow these design principles:

- **Consistent spacing**: 8px base unit (MUI standard)
- **Rounded corners**: `borderRadius: 2` (16px) for cards and panels
- **Elevation**: `elevation={1}` for controls, `elevation={2}` for panels
- **Colors**: Primary theme colors with subtle gradients
- **Responsive**: Mobile-first design with breakpoints
- **Accessibility**: ARIA labels, keyboard navigation support

---

## Performance Considerations

1. **Debouncing**: Consider debouncing text input filters to reduce API calls
2. **Memoization**: Use `React.memo` for result items to prevent unnecessary re-renders
3. **Virtualization**: For very large result sets (1000+), consider using react-window
4. **URL State**: Persisting state in URL enables:
   - Browser back/forward navigation
   - Bookmarking searches
   - Sharing filtered results

---

## Testing

Example test for FilterPanel:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from './FilterPanel';

test('renders filter panel with correct title', () => {
  render(
    <FilterPanel
      filters={{ minScore: 0, maxScore: 100 }}
      onFilterChange={jest.fn()}
      onClear={jest.fn()}
    />
  );
  
  expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
});

test('calls onClear when clear button clicked', () => {
  const mockClear = jest.fn();
  render(
    <FilterPanel
      filters={{ minScore: 50, maxScore: 100 }}
      onFilterChange={jest.fn()}
      onClear={mockClear}
    />
  );
  
  fireEvent.click(screen.getByText('Clear All'));
  expect(mockClear).toHaveBeenCalled();
});
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Dependencies

- Material-UI v5+
- React 18+
- React Router v6+ (for useSearchParams)

---

## Future Enhancements

1. **Filter Presets**: Save and load common filter combinations
2. **Filter Chips**: Display active filters as chips above results
3. **Advanced Search**: Natural language filter input
4. **Filter History**: Remember recent filter states
5. **Export Filters**: Share filter configurations via URL or JSON
