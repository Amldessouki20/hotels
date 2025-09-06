'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  DollarSign,
  Key,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface UserDetails {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  phone?: string;
  isActive: boolean;
  passwordExpired: boolean;
  passwordNeverExpires: boolean;
  salary?: number;
  maxDiscountRate?: number;
  createdAt: string;
  lastPasswordChange?: string;
  group?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  _count?: {
    userPermissions: number;
    createdBookings: number;
  };
}

interface UserPermission {
  id: string;
  permission: {
    id: string;
    module: string;
    action: string;
    description?: string;
  };
  grantedAt: string;
  source: 'user' | 'group';
}

interface UserDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      fetchUserPermissions();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{t('userManagement.userDetails')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'details' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              {t('userManagement.tabs.details')}
            </button>
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'permissions' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              {t('userManagement.tabs.permissions')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {activeTab === 'details' && user && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t('userManagement.basicInfo')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('users.fullName')}
                          </label>
                          <p className="text-gray-900">{user.fullName || user.username}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('users.username')}
                          </label>
                          <p className="text-gray-900">{user.username}</p>
                        </div>
                        {user.email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('users.email')}
                            </label>
                            <p className="text-gray-900 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </p>
                          </div>
                        )}
                        {user.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('users.phone')}
                            </label>
                            <p className="text-gray-900 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('users.status')}
                          </label>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? t('users.active') : t('users.inactive')}
                          </Badge>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('users.group')}
                          </label>
                          <p className="text-gray-900 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {user.group?.name || t('userManagement.noGroup')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {t('userManagement.securityInfo')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('userManagement.passwordStatus')}
                          </label>
                          <div className="flex items-center gap-2">
                            {user.passwordExpired ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-600">{t('userManagement.passwordExpired')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">{t('userManagement.passwordValid')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('userManagement.passwordExpiry')}
                          </label>
                          <div className="flex items-center gap-2">
                            {user.passwordNeverExpires ? (
                              <>
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-blue-600">{t('userManagement.neverExpires')}</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4" />
                                <span>{t('userManagement.expiresRegularly')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('users.createdAt')}
                          </label>
                          <p className="text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('ar')}
                          </p>
                        </div>
                        {user.lastPasswordChange && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('userManagement.lastPasswordChange')}
                            </label>
                            <p className="text-gray-900">
                              {new Date(user.lastPasswordChange).toLocaleDateString('ar')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        {t('userManagement.statistics')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {user._count?.userPermissions || 0}
                          </div>
                          <div className="text-sm text-blue-700">
                            {t('userManagement.userPermissions')}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {user._count?.createdBookings || 0}
                          </div>
                          <div className="text-sm text-green-700">
                            {t('userManagement.createdBookings')}
                          </div>
                        </div>
                        {user.salary && (
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                              {user.salary.toLocaleString()}
                            </div>
                            <div className="text-sm text-yellow-700">
                              {t('userManagement.salary')}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  {permissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{t('userManagement.noPermissions')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        permissions.reduce((acc, perm) => {
                          const module = perm.permission.module;
                          if (!acc[module]) acc[module] = [];
                          acc[module].push(perm);
                          return acc;
                        }, {} as Record<string, UserPermission[]>)
                      ).map(([module, modulePermissions]) => (
                        <Card key={module}>
                          <CardHeader>
                            <CardTitle className="text-lg">{module}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {modulePermissions.map((perm) => (
                                <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <div className="font-medium">{perm.permission.action}</div>
                                    {perm.permission.description && (
                                      <div className="text-sm text-gray-600">
                                        {perm.permission.description}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant={perm.source === 'group' ? 'secondary' : 'default'}>
                                    {perm.source === 'group' ? t('userManagement.fromGroup') : t('userManagement.direct')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}