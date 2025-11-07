import React, { useState } from 'react';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Work as WorkIcon,
    Upload as UploadIcon,
    Star as StarIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const EXPANDED_DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    // Persist collapsed state across navigation
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const currentUser = authService.getCurrentUser();
    const userRole = currentUser?.role?.toLowerCase();

    // Role-based color schemes
    const roleColors = {
        student: {
            primary: '#1976d2',      // Blue
            light: 'rgba(25, 118, 210, 0.08)',
            lighter: 'rgba(25, 118, 210, 0.12)',
            badge: 'rgba(25, 118, 210, 0.2)',
        },
        company: {
            primary: '#2e7d32',      // Green
            light: 'rgba(46, 125, 50, 0.08)',
            lighter: 'rgba(46, 125, 50, 0.12)',
            badge: 'rgba(46, 125, 50, 0.2)',
        },
        admin: {
            primary: '#d32f2f',      // Red
            light: 'rgba(211, 47, 47, 0.08)',
            lighter: 'rgba(211, 47, 47, 0.12)',
            badge: 'rgba(211, 47, 47, 0.2)',
        },
    };

    const currentColors = roleColors[userRole] || roleColors.student;

    // Role-specific menu items
    const getMenuItems = () => {
        const baseItems = [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['student', 'company', 'admin'] },
        ];

        const studentItems = [
            { text: 'AI Resume Intelligence', icon: <AIIcon />, path: '/resume-intelligence', roles: ['student'] },
            { text: 'AI Recommendations', icon: <StarIcon />, path: '/recommendations', roles: ['student'] },
            { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile', roles: ['student'] },
        ];

        const companyItems = [
            { text: 'My Internships', icon: <WorkIcon />, path: '/internships', roles: ['company'] },
            { text: 'AI Candidate Ranking', icon: <AIIcon />, path: '/intelligent-ranking', roles: ['company'] },
            { text: 'My Profile', icon: <PersonIcon />, path: '/company/profile', roles: ['company'] },
        ];

        const adminItems = [
            { text: 'User Management', icon: <PersonIcon />, path: '/admin/users', roles: ['admin'] },
            { text: 'All Internships', icon: <WorkIcon />, path: '/internships', roles: ['admin'] },
            { text: 'Analytics', icon: <AIIcon />, path: '/admin/analytics', roles: ['admin'] },
            { text: 'My Profile', icon: <PersonIcon />, path: '/admin/profile', roles: ['admin'] },
        ];

        const allItems = [...baseItems, ...studentItems, ...companyItems, ...adminItems];
        return allItems.filter(item => item.roles.includes(userRole));
    };

    const menuItems = getMenuItems();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleBrandClick = (event) => {
        event.stopPropagation();
        // On mobile, keep original behavior (navigate). On desktop, toggle collapsed state
        if (isMobile) {
            navigate('/dashboard');
            return;
        }
        setCollapsed(prev => {
            const newValue = !prev;
            localStorage.setItem('sidebarCollapsed', newValue.toString());
            return newValue;
        });
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
        // Don't toggle collapse when navigating
    };

    const currentDrawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar
                onClick={handleBrandClick}
                sx={{
                    background: `linear-gradient(135deg, ${currentColors.primary} 0%, ${currentColors.primary}dd 100%)`,
                    color: 'white',
                    py: 2.5,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                    },
                }}
            >
                <StarIcon sx={{ mr: collapsed ? 0 : 1.5, fontSize: 28 }} />
                <Typography
                    variant="h5"
                    noWrap
                    component="div"
                    sx={{
                        fontWeight: 700,
                        letterSpacing: '-0.5px',
                        ml: collapsed ? 0 : 0.75,
                        opacity: collapsed ? 0 : 1,
                        width: collapsed ? 0 : 'auto',
                        transition: 'all 0.25s ease',
                        overflow: 'hidden',
                    }}
                >
                    SkillSync
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)' }} />
            <List sx={{ mt: 1, px: 1.5, flexGrow: 1 }}>
                {menuItems.map((item, index) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                            sx={{
                                borderRadius: 2,
                                py: 1.25,
                                pr: collapsed ? 1 : 2,
                                pl: collapsed ? 1 : 1.5,
                                transition: 'all 0.3s ease',
                                '&.Mui-selected': {
                                    background: `linear-gradient(135deg, ${currentColors.primary}15 0%, ${currentColors.primary}25 100%)`,
                                    borderLeft: `4px solid ${currentColors.primary}`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${currentColors.primary}20 0%, ${currentColors.primary}30 100%)`,
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: currentColors.light,
                                    transform: 'translateX(4px)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{
                                color: location.pathname === item.path ? currentColors.primary : '#666',
                                minWidth: collapsed ? 0 : 45,
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                mr: collapsed ? 0 : 1,
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontWeight: location.pathname === item.path ? 600 : 500,
                                    fontSize: '0.95rem',
                                }}
                                sx={{
                                    opacity: collapsed ? 0 : 1,
                                    width: collapsed ? 0 : 'auto',
                                    transition: 'all 0.25s ease',
                                    overflow: 'hidden',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
                    ml: { sm: `${currentDrawerWidth}px` },
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                }}
            >
                <Toolbar sx={{ py: 1 }}>
                    <IconButton
                        color="primary"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            flexGrow: 1,
                            color: '#1a1a1a',
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                        }}
                    >
                        {menuItems.find(item => item.path === location.pathname)?.text || 'SkillSync'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                display: { xs: 'none', sm: 'block' },
                                color: '#555',
                                fontWeight: 600,
                            }}
                        >
                            {currentUser?.full_name}
                        </Typography>
                        <Box
                            sx={{
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center',
                                background: `linear-gradient(135deg, ${currentColors.primary}15 0%, ${currentColors.primary}25 100%)`,
                                px: 2,
                                py: 0.75,
                                borderRadius: 2,
                                border: `1px solid ${currentColors.primary}30`,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    color: currentColors.primary,
                                }}
                            >
                                {userRole}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={handleMenuOpen}
                            size="small"
                            sx={{
                                ml: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                }
                            }}
                            aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                        >
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    background: `linear-gradient(135deg, ${currentColors.primary} 0%, ${currentColors.primary}dd 100%)`,
                                    color: 'white',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                            >
                                {currentUser?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                        </IconButton>
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                            sx: {
                                minWidth: 240,
                                borderRadius: 3,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                mt: 1,
                            }
                        }}
                    >
                        <Box sx={{ px: 3, py: 2 }}>
                            <Typography variant="body1" fontWeight="700" sx={{ color: '#1a1a1a' }}>
                                {currentUser?.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {currentUser?.email}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'inline-block',
                                    mt: 1.5,
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 2,
                                    textTransform: 'capitalize',
                                    background: `linear-gradient(135deg, ${currentColors.primary}15 0%, ${currentColors.primary}25 100%)`,
                                    border: `1px solid ${currentColors.primary}30`,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: currentColors.primary,
                                        fontWeight: 700,
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {userRole}
                                </Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem
                            onClick={handleLogout}
                            sx={{
                                py: 1.5,
                                px: 3,
                                borderRadius: 2,
                                mx: 1,
                                mb: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                    color: '#d32f2f',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography fontWeight={600}>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: EXPANDED_DRAWER_WIDTH },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: currentDrawerWidth,
                            transition: 'width 0.3s ease',
                            overflowX: 'hidden',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.4,
                        pointerEvents: 'none',
                    }
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
