'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  Users,
  Bed,
  MapPin,
  DollarSign,
  Building,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Mountain,
  Sun,
  Moon,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { applyColors, textStyles, buttonStyles } from '@/lib/colors';

interface Room {
  id: string;
  roomType: string;
  roomTypeDescription?: string;
  altDescription?: string;
  basePrice: number;
  salePrice?: number;
  discountPrice?: number;
  quantity: number;
  boardType: string;
  size?: string;
  capacity: number;
  floor?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  hotel: {
    id: string;
    name: string;
    code: string;
    address?: string;
  };
  roomAmenities: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
  createdBy: {
    id: string;
    username: string;
    fullName?: string;
  };
  seasonalPrices: Array<{
    id: string;
    startDate: string;
    endDate: string;
    price: number;
  }>;
  availabilitySlots: Array<{
    id: string;
    date: string;
    availableCount: number;
    blockedCount: number;
    notes?: string;
  }>;
  _count: {
    bookings: number;
    seasonalPrices: number;
    availabilitySlots: number;
  };
  createdAt: string;
  updatedAt: string;
}

const amenityIcons: { [key: string]: any } = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  gym: Dumbbell,
  pool: Waves,
  mountain: Mountain,
  beach: Sun,
  nightlife: Moon,
  star: Star,
  default: Bed
};

const boardTypes = {
  ROOM_ONLY: 'غرفة فقط',
  BED_BREAKFAST: 'إفطار',
  HALF_BOARD: 'نصف بورد',
  FULL_BOARD: 'بورد كامل'
};

export default function RoomDetails() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchRoomDetails();
    }
  }, [params.id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRoom(data.data);
      } else {
        setError(data.error || 'خطأ في تحميل بيانات الغرفة');
      }
    } catch (error) {
      console.error('خطأ في تحميل الغرفة:', error);
      setError('حدث خطأ في تحميل بيانات الغرفة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;
    
    try {
      const response = await fetch(`/api/rooms/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/admin/rooms');
      } else {
        alert(data.error || 'خطأ في حذف الغرفة');
      }
    } catch (error) {
      console.error('خطأ في حذف الغرفة:', error);
      alert('حدث خطأ في حذف الغرفة');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAmenityIcon = (amenityName: string) => {
    const iconKey = amenityName.toLowerCase().replace(/\s+/g, '');
    const IconComponent = amenityIcons[iconKey] || amenityIcons.default;
    return <IconComponent className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                خطأ في تحميل الغرفة
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'لم يتم العثور على الغرفة المطلوبة'}
              </p>
              <Button
                onClick={() => router.push('/admin/rooms')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                العودة إلى قائمة الغرف
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/rooms')}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {room.roomType}
                </h1>
                <p className="text-gray-600">
                  {room.hotel.name} - {room.hotel.code}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => router.push(`/admin/rooms/${room.id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                تعديل
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                حذف
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building className="w-6 h-6 mr-2 text-amber-600" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الغرفة
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {room.roomType}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الوجبة
                    </label>
                    <Badge className="bg-amber-100 text-amber-800">
                      {boardTypes[room.boardType as keyof typeof boardTypes]}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعة
                    </label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-amber-600" />
                      {room.capacity} شخص
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكمية
                    </label>
                    <p className="text-lg font-semibold text-gray-900 flex items-center">
                      <Bed className="w-5 h-5 mr-2 text-amber-600" />
                      {room.quantity} غرفة
                    </p>
                  </div>
                  {room.floor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الطابق
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {room.floor}
                      </p>
                    </div>
                  )}
                  {room.size && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الحجم
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {room.size} م²
                      </p>
                    </div>
                  )}
                </div>

                {room.roomTypeDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وصف نوع الغرفة
                    </label>
                    <p className="text-gray-700 leading-relaxed">
                      {room.roomTypeDescription}
                    </p>
                  </div>
                )}

                {room.altDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وصف إضافي
                    </label>
                    <p className="text-gray-700 leading-relaxed">
                      {room.altDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <DollarSign className="w-6 h-6 mr-2 text-amber-600" />
                  الأسعار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">السعر الأساسي</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatPrice(room.basePrice)}
                    </p>
                  </div>
                  
                  {room.salePrice && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">سعر البيع الحالي</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(room.salePrice)}
                      </p>
                    </div>
                  )}
                  
                  {room.discountPrice && (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">سعر الخصم</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPrice(room.discountPrice)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Validity Period */}
                {(room.startDate || room.endDate) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      فترة صلاحية الغرفة
                    </h4>
                    <div className="text-blue-700">
                      {room.startDate && (
                        <p>من: {formatDate(room.startDate)}</p>
                      )}
                      {room.endDate && (
                        <p>إلى: {formatDate(room.endDate)}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amenities */}
            {room.roomAmenities.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Star className="w-6 h-6 mr-2 text-amber-600" />
                    المرافق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {room.roomAmenities.map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center p-3 bg-amber-50 rounded-lg"
                      >
                        {getAmenityIcon(amenity.name)}
                        <span className="mr-2 text-gray-700 font-medium">
                          {amenity.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2 text-amber-600" />
                  الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">الحالة</span>
                    <Badge 
                      className={room.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {room.isActive ? 'متاح' : 'غير متاح'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">الحجوزات</span>
                    <span className="font-semibold">{room._count.bookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">الأسعار الموسمية</span>
                    <span className="font-semibold">{room._count.seasonalPrices}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">فترات التوفر</span>
                    <span className="font-semibold">{room._count.availabilitySlots}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Info */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                  معلومات الفندق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{room.hotel.name}</p>
                  <p className="text-sm text-gray-600">كود: {room.hotel.code}</p>
                  {room.hotel.address && (
                    <p className="text-sm text-gray-600">{room.hotel.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Created By */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  معلومات الإنشاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    أنشأ بواسطة: {room.createdBy.fullName || room.createdBy.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    تاريخ الإنشاء: {formatDate(room.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    آخر تحديث: {formatDate(room.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
