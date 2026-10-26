// What the signed-in shell shows for each role: its colours, its sidebar entries and the top bar title.
import {
    Dashboard as DashboardIcon,
    Work as WorkIcon,
    Star as StarIcon,
    Person as PersonIcon,
    AutoAwesome as AIIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';

export const ROLE_COLORS = {
    student: {
        primary: '#1976d2', // Blue
        light: 'rgba(25, 118, 210, 0.08)',
        lighter: 'rgba(25, 118, 210, 0.12)',
        badge: 'rgba(25, 118, 210, 0.2)',
    },
    company: {
        primary: '#2e7d32', // Green
        light: 'rgba(46, 125, 50, 0.08)',
        lighter: 'rgba(46, 125, 50, 0.12)',
        badge: 'rgba(46, 125, 50, 0.2)',
    },
    admin: {
        primary: '#d32f2f', // Red
        light: 'rgba(211, 47, 47, 0.08)',
        lighter: 'rgba(211, 47, 47, 0.12)',
        badge: 'rgba(211, 47, 47, 0.2)',
    },
};

const MENU_ITEMS = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['student', 'company', 'admin'] },

    { text: 'AI Resume Intelligence', icon: <AIIcon />, path: '/resume-intelligence', roles: ['student'] },
    { text: 'AI Recommendations', icon: <StarIcon />, path: '/recommendations', roles: ['student'] },
    { text: 'Browse Internships', icon: <WorkIcon />, path: '/internships', roles: ['student'] },
    { text: 'My Applications', icon: <AssignmentIcon />, path: '/applications', roles: ['student'] },
    { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile', roles: ['student'] },

    { text: 'My Internships', icon: <WorkIcon />, path: '/internships', roles: ['company'] },
    { text: 'AI Candidate Ranking', icon: <AIIcon />, path: '/intelligent-ranking', roles: ['company'] },
    { text: 'My Profile', icon: <PersonIcon />, path: '/company/profile', roles: ['company'] },

    { text: 'User Management', icon: <PersonIcon />, path: '/admin/users', roles: ['admin'] },
    { text: 'All Internships', icon: <WorkIcon />, path: '/internships', roles: ['admin'] },
    { text: 'Analytics', icon: <AIIcon />, path: '/admin/analytics', roles: ['admin'] },
    { text: 'My Profile', icon: <PersonIcon />, path: '/admin/profile', roles: ['admin'] },
];

// Titles for signed-in pages that have no sidebar entry of their own
const PAGE_TITLES = {
    '/internships/create': 'Post New Internship',
};

/** The colours for a role, falling back to the student palette for an unknown one. */
export const colorsFor = (role) => ROLE_COLORS[role] || ROLE_COLORS.student;

/** The sidebar entries a role sees, in menu order. */
export const menuItemsFor = (role) => MENU_ITEMS.filter((item) => item.roles.includes(role));

/** The top bar title for a path: its menu entry, a page outside the menu, or SkillSync. */
export const pageTitleFor = (pathname, menuItems) =>
    menuItems.find((item) => item.path === pathname)?.text || PAGE_TITLES[pathname] || 'SkillSync';
