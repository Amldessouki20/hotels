'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  UserCheck, 
  UserX,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Key,
  Mail,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import UserDetailsModal from './UserDetailsModal';
import UserPermissionsModal from './UserPermissionsModal';

interface User {
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
  group: {
    id: string;
    name: string;
    description?: string;
  };
  _count: {
    userPermissions: number;
    createdBookings: number;
  };
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface UserManagerProps {
  onUserChange?: () => void;
}

export default function UserManager({ onUserChange }: UserManagerProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [activeTab, setActiveTab] = useState('users');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [showUserPermissions, setShowUserPermissions] = useState<{ userId: string; userName: string } | null>(null);
  
  // Bulk operations state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    groupId: '',
    isActive: true,
    passwordNeverExpires: false,
    salary: '',
    maxDiscountRate: ''
  });

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGroup) params.append('groupId', selectedGroup);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user groups
  const loadUserGroups = async () => {
    try {
      setGroupsLoading(true);
      // طلب المجموعات النشطة فقط للاستخدام في نموذج إضافة المستخدم
      const response = await fetch('/api/admin/user-groups?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setUserGroups(data);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadUserGroups();
  }, [searchTerm, selectedGroup]);

  // Handle form submission for adding/editing user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    if (editingUser && formData.password && formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    if (!formData.username || formData.username.length < 3) {
      toast.error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    
    if (!formData.groupId) {
      toast.error('يجب اختيار مجموعة للمستخدم');
      return;
    }
    
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        maxDiscountRate: formData.maxDiscountRate ? parseFloat(formData.maxDiscountRate) : undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || (editingUser ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح'));
        await loadUsers();
        resetForm();
        if (onUserChange) onUserChange();
      } else {
        const error = await response.json();
        if (error.details && Array.isArray(error.details)) {
          // Handle Zod validation errors
          const errorMessages = error.details.map((detail: any) => detail.message).join('، ');
          toast.error(errorMessages);
        } else {
          toast.error(error.error || error.message || 'حدث خطأ أثناء حفظ المستخدم');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('حدث خطأ أثناء حفظ المستخدم');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      fullName: '',
      phone: '',
      password: '',
      groupId: '',
      isActive: true,
      passwordNeverExpires: false,
      salary: '',
      maxDiscountRate: ''
    });
    setShowAddForm(false);
    setEditingUser(null);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      password: '',
      groupId: user.group.id,
      isActive: user.isActive,
      passwordNeverExpires: user.passwordNeverExpires,
      salary: user.salary?.toString() || '',
      maxDiscountRate: user.maxDiscountRate?.toString() || ''
    });
    setEditingUser(user);
    setShowAddForm(true);
  };

  // Handle view user details
  const handleViewUser = (userId: string) => {
    setShowUserDetails(userId);
  };

  // Handle manage user permissions
  const handleManagePermissions = (user: User) => {
    setShowUserPermissions({
      userId: user.id,
      userName: user.fullName || user.username
    });
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadUsers();
        if (onUserChange) onUserChange();
      } else {
        const error = await response.json();
        toast.error(error.message || 'حدث خطأ أثناء حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('حدث خطأ أثناء حذف المستخدم');
    }
  };

  // Bulk operations functions
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: 'activate'
        })
      });
      
      if (response.ok) {
        await loadUsers();
        setSelectedUsers([]);
        toast.success('تم تفعيل المستخدمين المحددين بنجاح');
      } else {
        toast.error('حدث خطأ أثناء تفعيل المستخدمين');
      }
    } catch (error) {
      console.error('Error bulk activating users:', error);
      toast.error('حدث خطأ أثناء تفعيل المستخدمين');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: 'deactivate'
        })
      });
      
      if (response.ok) {
        await loadUsers();
        setSelectedUsers([]);
        toast.success('تم إلغاء تفعيل المستخدمين المحددين بنجاح');
      } else {
        toast.error('حدث خطأ أثناء إلغاء تفعيل المستخدمين');
      }
    } catch (error) {
      console.error('Error bulk deactivating users:', error);
      toast.error('حدث خطأ أثناء إلغاء تفعيل المستخدمين');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) return;
    
    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers })
      });
      
      if (response.ok) {
        await loadUsers();
        setSelectedUsers([]);
        toast.success('تم حذف المستخدمين المحددين بنجاح');
      } else {
        toast.error('حدث خطأ أثناء حذف المستخدمين');
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('حدث خطأ أثناء حذف المستخدمين');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUsers.length > 0) {
        params.append('userIds', selectedUsers.join(','));
      }
      params.append('format', 'csv');
      
      const response = await fetch(`/api/admin/users/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('حدث خطأ أثناء تصدير المستخدمين');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = !selectedGroup || user.group.id === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-gray-600">إدارة المستخدمين والصلاحيات</p>
          {selectedUsers.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              تم تحديد {selectedUsers.length} مستخدم
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkActivate}
                disabled={bulkLoading}
                className="flex items-center gap-1"
              >
                <UserCheck className="h-4 w-4" />
                تفعيل
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={bulkLoading}
                className="flex items-center gap-1"
              >
                <UserX className="h-4 w-4" />
                إلغاء تفعيل
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportUsers}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          )}
          <Button 
            variant="outline"
            onClick={handleExportUsers}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير الكل
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Add/Edit User Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetForm}
              >
                إلغاء
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم المستخدم *</label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    كلمة المرور {!editingUser && '*'}
                    <span className="text-xs text-gray-500 ml-2">(6 أحرف على الأقل)</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    minLength={6}
                    placeholder={editingUser ? 'اتركها فارغة للاحتفاظ بكلمة المرور الحالية' : 'أدخل كلمة المرور (6 أحرف على الأقل)'}
                    className={formData.password && formData.password.length > 0 && formData.password.length < 6 ? 'border-red-500' : ''}
                  />
                  {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">المجموعة *</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.groupId}
                    onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                    required
                    disabled={groupsLoading}
                  >
                    <option value="">
                      {groupsLoading ? 'جاري تحميل المجموعات...' : 
                       userGroups.length === 0 ? 'لا توجد مجموعات متاحة' : 
                       'اختر المجموعة'}
                    </option>
                    {!groupsLoading && userGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  {!groupsLoading && userGroups.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      يجب إنشاء مجموعات أولاً من صفحة إدارة المجموعات
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الراتب</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    placeholder="أدخل الراتب"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">أقصى نسبة خصم (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.maxDiscountRate}
                    onChange={(e) => setFormData({...formData, maxDiscountRate: e.target.value})}
                    placeholder="أدخل أقصى نسبة خصم"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span>المستخدم نشط</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.passwordNeverExpires}
                    onChange={(e) => setFormData({...formData, passwordNeverExpires: e.target.checked})}
                  />
                  <span>كلمة المرور لا تنتهي</span>
                </label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {editingUser ? 'تحديث المستخدم' : 'إضافة المستخدم'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">البحث</label>
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">المجموعة</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">جميع المجموعات</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGroup('');
                }}
                className="w-full"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              قائمة المستخدمين ({filteredUsers.length})
            </div>
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">تحديد الكل</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد مستخدمين</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.fullName || user.username}</h3>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        {user.passwordExpired && (
                          <Badge variant="destructive">كلمة المرور منتهية</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          <span>{user.username}</span>
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>{user.group.name}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span>الصلاحيات: {user._count.userPermissions}</span>
                        <span>الحجوزات: {user._count.createdBookings}</span>
                        <span>تاريخ الإنشاء: {new Date(user.createdAt).toLocaleDateString('ar')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewUser(user.id)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        title="تعديل المستخدم"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleManagePermissions(user)}
                        title="إدارة الصلاحيات"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        title="حذف المستخدم"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserDetails && (
        <UserDetailsModal
          userId={showUserDetails}
          isOpen={!!showUserDetails}
          onClose={() => setShowUserDetails(null)}
        />
      )}

      {/* User Permissions Modal */}
      {showUserPermissions && (
        <UserPermissionsModal
          userId={showUserPermissions.userId}
          userName={showUserPermissions.userName}
          isOpen={!!showUserPermissions}
          onClose={() => setShowUserPermissions(null)}
          onPermissionsUpdated={() => {
            loadUsers();
            if (onUserChange) onUserChange();
          }}
        />
      )}
    </div>
  );
}