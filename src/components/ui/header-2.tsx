'use client';
import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getCurrentTheme } from '@/lib/theme';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(50);
	const [logoSrc, setLogoSrc] = React.useState('/LOGO-BLANCO.svg');

	React.useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con data-theme fijado por el script inline de layout.tsx, no con el montaje
		setLogoSrc(getCurrentTheme() === 'light' ? '/LOGO-NEGRO.svg' : '/LOGO-BLANCO.svg');
		const observer = new MutationObserver(() => {
			setLogoSrc(getCurrentTheme() === 'light' ? '/LOGO-NEGRO.svg' : '/LOGO-BLANCO.svg');
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	}, []);

	const links = [
		{
			label: 'Producto',
			href: '/#producto',
		},
		{
			label: 'Cómo funciona',
			href: '/#como-funciona',
		},
		{
			label: 'Planes',
			href: '/#planes',
		},
		{
			label: 'Docs',
			href: '/docs',
		},
	];

	React.useEffect(() => {
		if (open) {
			// Disable scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Re-enable scroll
			document.body.style.overflow = '';
		}

		// Cleanup when component unmounts (important for Next.js)
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'mt-6 sticky top-0 z-50 mx-auto w-full max-w-5xl md:transition-all md:ease-out',
				{
					'border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg md:top-4 md:max-w-4xl md:rounded-md md:border md:shadow':
						scrolled && !open,
					'bg-background/90': open,
				},
			)}
		>
			<nav
				className={cn(
					'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
					{
						'md:px-2': scrolled,
					},
				)}
			>
				<Link href="/" className="flex items-center">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={logoSrc} alt="MODULA" className="h-4 w-auto" />
				</Link>
				<div className="hidden items-center gap-2 md:flex">
					{links.map((link, i) => (
						<Link key={i} className={buttonVariants({ variant: 'ghost' })} href={link.href}>
							{link.label}
						</Link>
					))}
					<Link href="/login" className={buttonVariants({ variant: 'outline' })}>
						Iniciar sesión
					</Link>
					<Link href="/register" className={buttonVariants({})}>
						Comenzar
					</Link>
					<ThemeToggle />
				</div>
				<div className="flex items-center gap-2 md:hidden">
					<ThemeToggle />
					<Button size="icon" variant="outline" onClick={() => setOpen(!open)}>
						<MenuToggleIcon open={open} className="size-5" duration={300} />
					</Button>
				</div>
			</nav>

			<div
				className={cn(
					'bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex h-full w-full flex-col justify-between gap-y-2 p-4',
					)}
				>
					<div className="grid gap-y-2">
						{links.map((link) => (
							<Link
								key={link.label}
								className={buttonVariants({
									variant: 'ghost',
									className: 'justify-start',
								})}
								href={link.href}
								onClick={() => setOpen(false)}
							>
								{link.label}
							</Link>
						))}
					</div>
					<div className="flex flex-col gap-2">
						<Link href="/login" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
							Iniciar sesión
						</Link>
						<Link href="/register" className={buttonVariants({ className: 'w-full' })} onClick={() => setOpen(false)}>
							Comenzar
						</Link>
					</div>
				</div>
			</div>
		</header>
	);
}
