'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserGroupManager from '@/components/admin/UserGroupManager';
import PermissionManager from '@/components/admin/PermissionManager';
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface GroupStats {
  totalGroups: number;
  totalPermissions: number;
  totalUsers: number;
  activeGroups: number;
}

interface PermissionStats {
  totalPermissions: number;
  totalModules: number;
  topModules: Array<{ module: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

export default function AdminGroupsPage() {
  const [activeTab, setActiveTab] = useState('groups');
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [permissionStats, setPermissionStats] = useState<PermissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  // جلب الإحصائيات
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // جلب إحصائيات المجموعات
      const groupsResponse = await fetch('/api/admin/user-groups?stats=true');
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroupStats(groupsData);
      }

      // جلب إحصائيات الصلاحيات
      const permissionsResponse = await fetch('/api/admin/permissions', {
        method: 'OPTIONS'
      });
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissionStats(permissionsData);
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المجموعات والصلاحيات</h1>
          <p className="text-gray-600 mt-2">
            إدارة مجموعات المستخدمين والصلاحيات بحرية كاملة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchStats}
            disabled={loading}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            تحديث الإحصائيات
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المجموعات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : groupStats?.totalGroups || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الصلاحيات</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : permissionStats?.totalPermissions || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الوحدات المتاحة</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : permissionStats?.totalModules || 0}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المجموعات النشطة</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : groupStats?.activeGroups || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أهم الوحدات والعمليات */}
      {!loading && permissionStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                أكثر الوحدات استخداماً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permissionStats.topModules.slice(0, 5).map((module, index) => (
                  <div key={module.module} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{module.module}</span>
                    <Badge variant="secondary">{module.count} صلاحية</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                أكثر العمليات استخداماً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permissionStats.topActions.slice(0, 5).map((action, index) => (
                  <div key={action.action} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{action.action}</span>
                    <Badge variant="outline">{action.count} مرة</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* تبويبات الإدارة */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                إدارة المجموعات
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                إدارة الصلاحيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">مجموعات المستخدمين</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    يمكنك إضافة مجموعات جديدة بحرية كاملة
                  </div>
                </div>
                <UserGroupManager />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">الصلاحيات والوحدات</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    يمكنك إضافة وحدات وعمليات جديدة دون قيود
                  </div>
                </div>
                <PermissionManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            ملاحظات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>
                <strong>حرية كاملة:</strong> يمكنك إضافة أي مجموعات أو صلاحيات جديدة دون قيود
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>
                <strong>وحدات مخصصة:</strong> أضف وحدات جديدة حسب احتياجات مشروعك
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>
                <strong>عمليات مرنة:</strong> حدد العمليات المطلوبة لكل وحدة (create, read, update, delete, etc.)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
              <span>
                <strong>تنبيه:</strong> لا يمكن حذف المجموعات أو الصلاحيات المستخدمة حالياً
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}