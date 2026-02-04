import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileText, Search, Check, ChevronRight } from 'lucide-react';
import type { ApprovalType } from '@hr-platform/shared-types';
import type { ApprovalLineStep } from './ApprovalLineBuilder';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: ApprovalType;
  description?: string;
  content: string;
  defaultApprovalLine?: ApprovalLineStep[];
  category?: string;
}

export interface DocumentTemplateSelectorProps {
  templates: DocumentTemplate[];
  selectedTemplate: DocumentTemplate | null;
  onSelect: (template: DocumentTemplate) => void;
  className?: string;
}

export function DocumentTemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
  className,
}: DocumentTemplateSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchKeyword, setSearchKeyword] = React.useState('');

  const filteredTemplates = React.useMemo(() => {
    if (!searchKeyword.trim()) return templates;
    const keyword = searchKeyword.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(keyword) ||
        t.description?.toLowerCase().includes(keyword) ||
        t.category?.toLowerCase().includes(keyword)
    );
  }, [templates, searchKeyword]);

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    const groups = new Map<string, DocumentTemplate[]>();
    filteredTemplates.forEach((template) => {
      const category = template.category || '기타';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelect = (template: DocumentTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {selectedTemplate ? selectedTemplate.name : '문서 양식 선택'}
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>문서 양식 선택</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="양식 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Template List */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchKeyword ? '검색 결과가 없습니다.' : '등록된 양식이 없습니다.'}
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(groupedTemplates.entries()).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {category}
                    </h4>
                    <div className="grid gap-2">
                      {categoryTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplate?.id === template.id}
                          onSelect={() => handleSelect(template)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Selected template preview */}
      {selectedTemplate && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{selectedTemplate.name}</p>
                {selectedTemplate.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(selectedTemplate)}
                className="text-xs"
              >
                양식 적용
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: DocumentTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-colors',
        'hover:bg-muted/50',
        isSelected && 'border-primary bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{template.name}</p>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {template.description}
              </p>
            )}
          </div>
        </div>
        {isSelected && (
          <Check className="h-5 w-5 text-primary" />
        )}
      </div>
    </button>
  );
}
