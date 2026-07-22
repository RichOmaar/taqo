import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './AppShell';
import { NavItem } from './NavItem';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

describe('NavItem', () => {
  it('marks the active entry for assistive tech', () => {
    render(
      <>
        <NavItem label="Panel" active />
        <NavItem label="Reseñas" />
      </>,
    );

    expect(screen.getByText('Panel').closest('a')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Reseñas').closest('a')).not.toHaveAttribute('aria-current');
  });

  it('hides the icon from the accessible name', () => {
    // The label already names the item; announcing the icon would double it up.
    render(<NavItem label="Panel" icon={<span>icon</span>} />);

    expect(screen.getByText('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders as the given component so apps can pass a router link', () => {
    function Link({ children, ...rest }: { children?: React.ReactNode }) {
      return <button {...rest}>{children}</button>;
    }

    render(<NavItem label="Panel" as={Link} />);

    expect(screen.getByRole('button', { name: 'Panel' })).toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  it('renders the brand, nav entries and footer', () => {
    render(
      <Sidebar title="Bistro Moderno" subtitle="Panel de control" footer={<button>Salir</button>}>
        <NavItem label="Panel" active />
      </Sidebar>,
    );

    expect(screen.getByText('Bistro Moderno')).toBeInTheDocument();
    expect(screen.getByText('Panel de control')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
  });

  it('omits the footer when none is given', () => {
    render(
      <Sidebar title="Bistro Moderno">
        <NavItem label="Panel" />
      </Sidebar>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('TopBar', () => {
  it('renders the title as the page heading', () => {
    render(<TopBar title="Panel" subtitle="resumen de hoy" />);

    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.getByText('resumen de hoy')).toBeInTheDocument();
  });

  it('renders actions when given', () => {
    render(<TopBar title="Panel" actions={<button>Nueva fila</button>} />);

    expect(screen.getByRole('button', { name: 'Nueva fila' })).toBeInTheDocument();
  });
});

describe('AppShell', () => {
  it('places the sidebar alongside the main content region', () => {
    render(
      <AppShell sidebar={<Sidebar title="Bistro Moderno">{null}</Sidebar>}>
        <p>Contenido</p>
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
    expect(screen.getByText('Bistro Moderno')).toBeInTheDocument();
  });
});
