import React from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    IconButton,
    alpha,
    useTheme
} from '@mui/material';
import { Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Category list component for reminder settings (left panel)
 */
export const ReminderCategoryList = ({
    tabsContent,
    tabValue,
    onTabChange,
    settings,
    onEditCategory,
    onDeleteCategory
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            <List sx={{ p: 0 }}>
                {tabsContent.map((tab, index) => {
                    const paramType = settings.customParameterTypes.find(pt => pt.id === tab.paramTypeId);
                    const isSelected = index === tabValue;
                    const paramColor = tab.color || paramType?.color || theme.palette.primary.main;

                    const canEdit = paramType && !paramType.isSystem && paramType.id !== 'static_category_status';

                    return (
                        <ListItem
                            key={tab.paramTypeId || tab.key || `tab_${index}`}
                            disablePadding
                            sx={{ mb: 0.5 }}
                        >
                            <ListItemButton
                                onClick={() => onTabChange(index)}
                                selected={isSelected}
                                sx={{
                                    borderRadius: '12px',
                                    py: 1.5,
                                    px: 2,
                                    bgcolor: isSelected ? alpha(paramColor, 0.1) : 'transparent',
                                    border: isSelected ? `2px solid ${paramColor}` : `2px solid transparent`,
                                    '&:hover': {
                                        bgcolor: alpha(paramColor, 0.05)
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: alpha(paramColor, 0.1),
                                        '&:hover': {
                                            bgcolor: alpha(paramColor, 0.15)
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Box sx={{ color: isSelected ? paramColor : 'text.secondary' }}>
                                        {tab.icon}
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={tab.label}
                                    sx={{
                                        '& .MuiTypography-root': {
                                            fontWeight: isSelected ? 800 : 600,
                                            fontSize: '0.9rem',
                                            color: isSelected ? paramColor : 'text.primary'
                                        }
                                    }}
                                />
                                {/* Edit/delete buttons - disabled for system categories and status virtual category */}
                                {canEdit && (
                                    <Box
                                        sx={{ display: 'flex', gap: 0.5, ml: 1 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditCategory(paramType);
                                            }}
                                            sx={{
                                                p: 0.5,
                                                opacity: 0.6,
                                                '&:hover': {
                                                    opacity: 1,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.15)
                                                }
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteCategory(paramType);
                                            }}
                                            sx={{
                                                p: 0.5,
                                                opacity: 0.6,
                                                '&:hover': {
                                                    opacity: 1,
                                                    bgcolor: alpha(theme.palette.error.main, 0.15),
                                                    color: 'error.main'
                                                }
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </IconButton>
                                    </Box>
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};
