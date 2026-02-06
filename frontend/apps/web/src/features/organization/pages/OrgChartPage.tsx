import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrgTree } from '../components/OrgTree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Search, ArrowLeft, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

interface DepartmentEmployee {
  id: string;
  name: string;
  employeeNumber: string;
  positionName?: string;
  gradeName?: string;
  departmentName: string;
  departmentId: string;
  profileImageUrl?: string;
}

export default function OrgChartPage() {
  const isMobile = useIsMobile();
  const [selectedDeptId, setSelectedDeptId] = useState<string>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  const { data: treeData } = useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DepartmentTreeNode[]>>('/departments/tree');
      return res.data.data;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['departments', selectedDeptId, 'employees'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DepartmentEmployee[]>>(
        `/departments/${selectedDeptId}/employees`
      );
      return res.data.data;
    },
    enabled: !!selectedDeptId,
  });

  // Find selected department info from tree
  const findDept = (
    nodes: DepartmentTreeNode[],
    id: string
  ): DepartmentTreeNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findDept(node.children || [], id);
      if (found) return found;
    }
    return undefined;
  };

  const selectedDept =
    treeData && selectedDeptId ? findDept(treeData, selectedDeptId) : undefined;

  // Filter tree by search keyword
  const filterTree = (
    nodes: DepartmentTreeNode[],
    keyword: string
  ): DepartmentTreeNode[] => {
    if (!keyword) return nodes;
    const lower = keyword.toLowerCase();
    return nodes.reduce<DepartmentTreeNode[]>((acc, node) => {
      const filteredChildren = filterTree(node.children || [], keyword);
      if (
        node.name.toLowerCase().includes(lower) ||
        filteredChildren.length > 0
      ) {
        acc.push({
          ...node,
          children:
            filteredChildren.length > 0
              ? filteredChildren
              : node.children || [],
        });
      }
      return acc;
    }, []);
  };

  const filteredTree = treeData ? filterTree(treeData, searchKeyword) : [];

  const handleSelectDept = (node: DepartmentTreeNode) => {
    setSelectedDeptId(node.id);
    if (isMobile) setShowDetail(true);
  };

  const getInitials = (name: string) => name.slice(0, 1);

  // Mobile detail view
  if (isMobile && showDetail && selectedDept) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDetail(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{selectedDept.name}</h1>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              부서 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">부서코드</span>
              <span>{selectedDept.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">인원수</span>
              <Badge variant="secondary">{selectedDept.employeeCount}명</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              부서 구성원 ({employeesData?.length ?? 0}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeesData?.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {emp.positionName || emp.gradeName || '-'}
                    </p>
                  </div>
                </div>
              ))}
              {(!employeesData || employeesData.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  소속 직원이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop / Mobile tree view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">조직도</h1>
      </div>

      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-12 gap-6'}>
        {/* Left: Tree */}
        <div className={isMobile ? '' : 'col-span-5'}>
          <Card>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="부서 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredTree.length > 0 ? (
                <OrgTree
                  data={filteredTree}
                  selectedId={selectedDeptId}
                  onSelect={handleSelectDept}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchKeyword
                    ? '검색 결과가 없습니다.'
                    : '조직 데이터를 불러오는 중...'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Detail */}
        {!isMobile && (
          <div className="col-span-7 space-y-4">
            {selectedDept ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {selectedDept.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">부서코드</span>
                        <p className="font-medium">{selectedDept.code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">인원수</span>
                        <p className="font-medium">
                          {selectedDept.employeeCount}명
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      부서 구성원 ({employeesData?.length ?? 0}명)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {employeesData?.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.positionName || emp.gradeName || '-'} ·{' '}
                              {emp.employeeNumber}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!employeesData || employeesData.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          소속 직원이 없습니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <User className="h-12 w-12 mb-4 opacity-30" />
                  <p>좌측 조직도에서 부서를 선택하세요.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
