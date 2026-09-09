import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ClassForm } from '../../components/classes/ClassForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { classService } from '../../services/class.service';
import type { ClassDetail, UpdateClassPayload } from '../../types/class.types';
import { getClassApiErrorMessage, getClassBasePath } from '../../utils/classHelper';

export const ClassEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getClassBasePath(location.pathname);

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const classId = parseInt(id || '', 10);

  const fetchDetail = useCallback(async () => {
    if (isNaN(classId) || classId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setServerError(null);
    setIsNotFound(false);

    try {
      const response = await classService.getClassById(classId);
      if (response.success && response.data) {
        setClassDetail(response.data);
      } else {
        setServerError(response.message || 'Không thể tải thông tin lớp học.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setServerError(getClassApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdate = async (payload: UpdateClassPayload) => {
    if (!classDetail) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await classService.updateClass(classDetail.id, payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${classDetail.id}`, {
          replace: true,
          state: { flashMessage: 'Cập nhật lớp học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật lớp học.');
      }
    } catch (err: unknown) {
      setServerError(getClassApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title={classDetail ? `Chỉnh sửa lớp học: ${classDetail.classCode}` : 'Chỉnh sửa lớp học'}
          subtitle="Cập nhật thông tin khóa học, giáo viên phụ trách, thời gian và sĩ số lớp học"
          breadcrumbs={[
            { label: 'Quản lý lớp học', path: basePath },
            {
              label: classDetail ? classDetail.classCode : 'Chi tiết',
              path: classDetail ? `${basePath}/${classDetail.id}` : undefined
            },
            { label: 'Chỉnh sửa' }
          ]}
        />

        {isLoading && <LoadingState message="Đang tải dữ liệu lớp học..." />}

        {isNotFound && !isLoading && (
          <EmptyState
            title="Không tìm thấy lớp học"
            description="Lớp học bạn muốn chỉnh sửa không tồn tại hoặc đã bị xóa."
            actionText="Quay lại danh sách lớp học"
            onAction={() => navigate(basePath)}
          />
        )}

        {!isLoading && classDetail && (
          <ClassForm
            mode="edit"
            initialData={classDetail}
            onSubmit={handleUpdate}
            onCancel={() => navigate(`${basePath}/${classDetail.id}`)}
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        )}
      </div>
    </AppShell>
  );
};
