import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render title as h1', () => {
    render(<PageHeader title="Heading" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Heading');
  });

  it('should render description', () => {
    render(<PageHeader title="Title" description="Description text" />);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText(/./)).toHaveTextContent('Title');
  });

  it('should render actions', () => {
    render(<PageHeader title="Title" actions={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should not render actions container when no actions provided', () => {
    render(<PageHeader title="Title" />);
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
  });

  it('should render multiple actions', () => {
    render(
      <PageHeader
        title="Title"
        actions={
          <>
            <button>First</button>
            <button>Second</button>
          </>
        }
      />
    );
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
  });
});
