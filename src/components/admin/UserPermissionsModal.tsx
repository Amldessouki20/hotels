'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Shield, 
  Plus, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

interface UserPermission {
  id: string;
  permission: Permission;
  grantedAt: string;
  source: 'user' | 'group';
}

interface UserPermissionsModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
}

export default function UserPermissionsModal({ 
  userId, 
  userName, 
  isOpen, 
  onClose, 
  onPermissionsUpdated 
}: UserPermissionsModalProps) {
  const { t } = useTranslation();
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [pendingChanges, setPendingChanges] = useState<{
    toAdd: string[];
    toRemove: string[];
  }>({ toAdd: [], toRemove: [] });

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserPermissions();
      fetchAvailablePermissions();
    }
  }, [isOpen, userId]);

  const fetchUserPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching available permissions:', error);
    }
  };

  const handleAddPermission = (permissionId: string) => {
    setPendingChanges(prev => ({
      toAdd: [...prev.toAdd.filter(id => id !== permissionId), permissionId],
      toRemove: prev.toRemove.filter(id => id !== permissionId)
    }));
  };

  const handleRemovePermission = (permissionId: string) => {
    const userPerm = userPermissions.find(up => up.permission.id === permissionId);
    if (userPerm && userPerm.source === 'user') {
      setPendingChanges(prev => ({
        toAdd: prev.toAdd.filter(id => id !== permissionId),
        toRemove: [...prev.toRemove.filter(id => id !== permissionId), permissionId]
      }));
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Add new permissions
      for (const permissionId of pendingChanges.toAdd) {
        const response = await fetch(`/api/admin/users/${userId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionId })
        });
        if (!response.ok) {
          throw new Error('Failed to add permission');
        }
      }

      // Remove permissions
      for (const permissionId of pendingChanges.toRemove) {
        const userPerm = userPermissions.find(up => up.permission.id === permissionId);
        if (userPerm) {
          const response = await fetch(`/api/admin/users/${userId}/permissions/${userPerm.id}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error('Failed to remove permission');
          }
        }
      }

      // Refresh permissions
      await fetchUserPermissions();
      setPendingChanges({ toAdd: [], toRemove: [] });
      
      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error(t('userManagement.errorSavingPermissions'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    setPendingChanges({ toAdd: [], toRemove: [] });
  };

  const filteredAvailablePermissions = availablePermissions.filter(permission => {
    const matchesSearch = !searchTerm || 
      permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = !selectedModule || permission.module === selectedModule;
    
    return matchesSearch && matchesModule;
  });

  const getPermissionStatus = (permissionId: string) => {
    const hasPermission = userPermissions.some(up => up.permission.id === permissionId);
    const isBeingAdded = pendingChanges.toAdd.includes(permissionId);
    const isBeingRemoved = pendingChanges.toRemove.includes(permissionId);
    
    if (isBeingAdded) return 'adding';
    if (isBeingRemoved) return 'removing';
    if (hasPermission) return 'has';
    return 'none';
  };

  const getUserPermissionSource = (permissionId: string) => {
    const userPerm = userPermissions.find(up => up.permission.id === permissionId);
    return userPerm?.source || null;
  };

  const modules = [...new Set(availablePermissions.map(p => p.module))];
  const hasChanges = pendingChanges.toAdd.length > 0 || pendingChanges.toRemove.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{t('userManagement.managePermissions')}</h2>
            <p className="text-gray-600">{userName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search and Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    {t('userManagement.searchPermissions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common.search')}</label>
                      <Input
                        placeholder={t('userManagement.searchPermissionsPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('userManagement.module')}</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                      >
                        <option value="">{t('userManagement.allModules')}</option>
                        {modules.map(module => (
                          <option key={module} value={module}>{module}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current User Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t('userManagement.currentPermissions')} ({userPermissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userPermissions.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">{t('userManagement.noPermissions')}</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(
                        userPermissions.reduce((acc, perm) => {
                          const module = perm.permission.module;
                          if (!acc[module]) acc[module] = [];
                          acc[module].push(perm);
                          return acc;
                        }, {} as Record<string, UserPermission[]>)
                      ).map(([module, modulePermissions]) => (
                        <div key={module} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{module}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modulePermissions.map((perm) => {
                              const status = getPermissionStatus(perm.permission.id);
                              return (
                                <div key={perm.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1">
                                    <div className="font-medium">{perm.permission.action}</div>
                                    {perm.permission.description && (
                                      <div className="text-sm text-gray-600">
                                        {perm.permission.description}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={perm.source === 'group' ? 'secondary' : 'default'}>
                                      {perm.source === 'group' ? t('userManagement.fromGroup') : t('userManagement.direct')}
                                    </Badge>
                                    {perm.source === 'user' && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemovePermission(perm.permission.id)}
                                        disabled={status === 'removing'}
                                      >
                                        {status === 'removing' ? (
                                          <RotateCcw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {t('userManagement.availablePermissions')} ({filteredAvailablePermissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredAvailablePermissions.reduce((acc, perm) => {
                        const module = perm.module;
                        if (!acc[module]) acc[module] = [];
                        acc[module].push(perm);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([module, modulePermissions]) => (
                      <div key={module} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">{module}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePermissions.map((permission) => {
                            const status = getPermissionStatus(permission.id);
                            const source = getUserPermissionSource(permission.id);
                            
                            return (
                              <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <div className="font-medium">{permission.action}</div>
                                  {permission.description && (
                                    <div className="text-sm text-gray-600">
                                      {permission.description}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {status === 'has' && (
                                    <Badge variant={source === 'group' ? 'secondary' : 'default'}>
                                      {source === 'group' ? t('userManagement.fromGroup') : t('userManagement.direct')}
                                    </Badge>
                                  )}
                                  {status === 'adding' && (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      {t('userManagement.adding')}
                                    </Badge>
                                  )}
                                  {status === 'removing' && (
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                      {t('userManagement.removing')}
                                    </Badge>
                                  )}
                                  
                                  {status === 'none' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddPermission(permission.id)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  {status === 'has' && source === 'user' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRemovePermission(permission.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  {status === 'adding' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPendingChanges(prev => ({
                                        ...prev,
                                        toAdd: prev.toAdd.filter(id => id !== permission.id)
                                      }))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  {status === 'removing' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPendingChanges(prev => ({
                                        ...prev,
                                        toRemove: prev.toRemove.filter(id => id !== permission.id)
                                      }))}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasChanges && (
              <span>
                {t('userManagement.pendingChanges')}: 
                {pendingChanges.toAdd.length > 0 && (
                  <span className="text-green-600 mx-1">
                    +{pendingChanges.toAdd.length}
                  </span>
                )}
                {pendingChanges.toRemove.length > 0 && (
                  <span className="text-red-600 mx-1">
                    -{pendingChanges.toRemove.length}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleResetChanges}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('common.reset')}
                </Button>
                <Button onClick={handleSaveChanges} disabled={saving}>
                  {saving ? (
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('common.save')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}