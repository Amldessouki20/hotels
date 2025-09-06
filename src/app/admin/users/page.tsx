'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, UserPlus, Shield, Activity } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import UserManager from '@/components/admin/UserManager';
import { applyColors, textStyles } from '@/lib/colors';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalGroups: number;
  usersWithCustomPermissions: number;
  recentlyCreated: number;
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalGroups: 0,
    usersWithCustomPermissions: 0,
    recentlyCreated: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // جلب إحصائيات المستخدمين
  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      
      // جلب إحصائيات المستخدمين
      const usersResponse = await fetch('/api/admin/users?stats=true');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        
        // جلب إحصائيات المجموعات
        const groupsResponse = await fetch('/api/admin/user-groups?stats=true');
        const groupsData = groupsResponse.ok ? await groupsResponse.json() : { stats: { totalGroups: 0 } };
        
        setUserStats({
          totalUsers: usersData.stats?.totalUsers || 0,
          activeUsers: usersData.stats?.activeUsers || 0,
          inactiveUsers: usersData.stats?.inactiveUsers || 0,
          totalGroups: groupsData.stats?.totalGroups || 0,
          usersWithCustomPermissions: usersData.stats?.usersWithCustomPermissions || 0,
          recentlyCreated: usersData.stats?.recentlyCreated || 0
        });
      }
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستخدمين:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: userStats.totalUsers,
      icon: Users,
      description: 'العدد الكلي للمستخدمين في النظام',
      color: 'text-blue-600'
    },
    {
      title: 'المستخدمون النشطون',
      value: userStats.activeUsers,
      icon: Activity,
      description: 'المستخدمون المفعلون حالياً',
      color: 'text-green-600'
    },
    {
      title: 'المستخدمون غير النشطون',
      value: userStats.inactiveUsers,
      icon: Users,
      description: 'المستخدمون المعطلون',
      color: 'text-red-600'
    },
    {
      title: 'المجموعات المتاحة',
      value: userStats.totalGroups,
      icon: Shield,
      description: 'عدد مجموعات المستخدمين',
      color: 'text-purple-600'
    },
    {
      title: 'صلاحيات مخصصة',
      value: userStats.usersWithCustomPermissions,
      icon: Shield,
      description: 'مستخدمون لديهم صلاحيات إضافية',
      color: 'text-orange-600'
    },
    {
      title: 'مستخدمون جدد',
      value: userStats.recentlyCreated,
      icon: UserPlus,
      description: 'تم إنشاؤهم خلال آخر 30 يوم',
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-2">
            إدارة شاملة للمستخدمين وصلاحياتهم في النظام
          </p>
        </div>
        <Button
          onClick={fetchUserStats}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث الإحصائيات
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${textStyles.caption}`}>
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${textStyles.heading.replace('text-3xl', 'text-2xl')}`}>
                  {isLoading ? '...' : stat.value.toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${textStyles.muted}`}>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Important Notes */}
      <Card className={applyColors.card.info()}>
        <CardHeader>
          <CardTitle className={`${textStyles.info} flex items-center gap-2`}>
            <Shield className="h-5 w-5" />
            ملاحظات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p>• يمكن إضافة مستخدمين جدد وتعيينهم لمجموعات مختلفة</p>
          <p>• يمكن تخصيص صلاحيات إضافية لأي مستخدم بشكل فردي</p>
          <p>• المستخدمون المرتبطون ببيانات لا يمكن حذفهم، بل يتم إلغاء تفعيلهم</p>
          <p>• تغيير كلمة المرور يؤدي إلى تحديث تاريخ آخر تغيير</p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            إدارة المستخدمين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>
                إضافة وتعديل وحذف المستخدمين، وإدارة صلاحياتهم الفردية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManager onUserChange={fetchUserStats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}