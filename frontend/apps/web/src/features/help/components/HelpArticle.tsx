import { ReactNode } from 'react';
import { ArrowLeft, Clock, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface HelpArticleData {
  id: string;
  title: string;
  content: ReactNode;
  category?: string;
  icon?: ReactNode;
  summary?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  readTime?: number;
  relatedArticles?: { id: string; title: string }[];
}

interface HelpArticleProps {
  article: HelpArticleData;
  onFeedback?: (helpful: boolean) => void;
  className?: string;
}

export function HelpArticle({
  article,
  onFeedback,
  className,
}: HelpArticleProps) {
  const navigate = useNavigate();

  return (
    <div className={className}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-6">
            {article.category && (
              <span className="inline-block rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {article.category}
              </span>
            )}
            <h1 className="mt-3 text-2xl font-bold flex items-center gap-2">
              {article.icon}
              {article.title}
            </h1>
            {article.summary && (
              <p className="mt-2 text-muted-foreground">{article.summary}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {article.author}
                </span>
              )}
              {article.createdAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(article.createdAt, 'yyyy년 M월 d일', { locale: ko })}
                  {article.updatedAt && (
                    <span className="text-xs">
                      (업데이트:{' '}
                      {format(article.updatedAt, 'yyyy.M.d', { locale: ko })})
                    </span>
                  )}
                </span>
              )}
              {article.readTime && (
                <span>약 {article.readTime}분 소요</span>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {article.content}
          </div>

          <Separator className="my-6" />

          {/* Feedback */}
          {onFeedback && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                이 문서가 도움이 되었나요?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFeedback(true)}
                >
                  <ThumbsUp className="mr-1 h-4 w-4" />
                  도움이 됐어요
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFeedback(false)}
                >
                  <ThumbsDown className="mr-1 h-4 w-4" />
                  아쉬워요
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold">관련 문서</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {article.relatedArticles.map((related) => (
              <Button
                key={related.id}
                variant="outline"
                className="justify-start"
                onClick={() => navigate(`/help/articles/${related.id}`)}
              >
                {related.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpArticle;
