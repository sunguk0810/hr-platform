import { bench, describe } from 'vitest';
import { filterTree } from '../treeUtils';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

const generateTree = (depth: number, breadth: number, currentDepth: number = 0): DepartmentTreeNode[] => {
  if (currentDepth >= depth) return [];

  const nodes: DepartmentTreeNode[] = [];
  for (let i = 0; i < breadth; i++) {
    const node: DepartmentTreeNode = {
      id: `node-${currentDepth}-${i}`,
      code: `code-${currentDepth}-${i}`,
      name: `Department ${currentDepth}-${i}`,
      level: currentDepth,
      sortOrder: i,
      employeeCount: 10,
      children: generateTree(depth, breadth, currentDepth + 1),
    };
    nodes.push(node);
  }
  return nodes;
};

describe('filterTree performance', () => {
  // Generate a reasonably large tree
  // Depth 5, breadth 5 => 5^0 + 5^1 + 5^2 + 5^3 + 5^4 + 5^5 nodes?
  // Let's verify logic.
  // Depth 0: 5 nodes. Each has 5 children.
  // Total nodes = 5 * (5^0 + 5^1 + ... + 5^(depth-1))
  // With depth=5, breadth=5: 5 + 25 + 125 + 625 + 3125 = 3905 nodes.
  const treeData = generateTree(5, 5);

  bench('filterTree with keyword "Department 1"', () => {
    filterTree(treeData, 'Department 1');
  });

  bench('filterTree with keyword matching nothing', () => {
    filterTree(treeData, 'NonExistentDepartment');
  });

  bench('filterTree with empty keyword', () => {
    filterTree(treeData, '');
  });
});
