import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { RecordCard } from '../components/RecordCard';
import { ArrowLeft } from 'lucide-react';

export default function RecordCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">잘못된 접근입니다.</p>
        <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="인사기록카드"
        description="직원의 상세 인사정보를 확인합니다."
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        }
      />

      <RecordCard employeeId={id} />
    </>
  );
}
