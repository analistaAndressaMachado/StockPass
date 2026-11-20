import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import './Select.css';

type SelectOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  tone?: 'green' | 'blue' | 'gray';
};

type SelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  invalid?: boolean;
  size?: 'md' | 'sm';
};

// value/options permanecem string; telas com IDs numéricos devem converter com String()/Number().
export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  disabled = false,
  className = '',
  required = false,
  id,
  name,
  invalid = false,
  size = 'md',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({
    top: 0, left: 0, width: 0, maxHeight: 240,
  });
  const [opensUp, setOpensUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const activeOption = options[activeIndex];
  const selectedOption = options.find((option) => option.value === value);
  const rootClassName = ['ui-select', className].filter(Boolean).join(' ');

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      const maxListHeight = 240;
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - gap);
      const spaceAbove = Math.max(0, rect.top - gap);
      const openAbove = spaceBelow < Math.min(maxListHeight, 120) && spaceAbove > spaceBelow;
      setOpensUp(openAbove);
      setPosition({
        top: openAbove ? undefined : rect.bottom + gap,
        bottom: openAbove ? window.innerHeight - rect.top + gap : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(0, Math.min(maxListHeight, openAbove ? spaceAbove : spaceBelow)),
      });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) setOpen(false);
    };
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [open]);

  function openList() {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(option: SelectOption<T>) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!open && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      openList();
      return;
    }

    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
    } else if (event.key === 'Enter' && activeOption) {
      event.preventDefault();
      selectOption(activeOption);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={rootClassName}>
      {required && <input className="ui-select__validation" type="text" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} name={name} />}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`ui-select__trigger${open ? ' ui-select__trigger--open' : ''}${invalid ? ' ui-select__trigger--invalid' : ''}${size === 'sm' ? ' ui-select__trigger--sm' : ''}${selectedOption?.tone ? ` ui-select__trigger--tone-${selectedOption.tone}` : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={listId}
        aria-activedescendant={open && activeOption ? `${listId}-option-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={`ui-select__value${selectedOption ? '' : ' ui-select__value--placeholder'}`}>{selectedOption?.label ?? placeholder ?? ''}</span>
        <svg
          className="ui-select__arrow"
          viewBox="0 0 20 20"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={listRef}
          id={listId}
          className={['ui-select__list', opensUp && 'ui-select__list--up', className].filter(Boolean).join(' ')}
          role="listbox"
          aria-label={ariaLabel}
          style={{ position: 'fixed', top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;
            return (
              <div
                id={`${listId}-option-${index}`}
                key={option.value}
                className={[
                  'ui-select__option',
                  selected && 'ui-select__option--selected',
                  option.tone && `ui-select__option--tone-${option.tone}`,
                  active && 'ui-select__option--active',
                  option.disabled && 'ui-select__option--disabled',
                ].filter(Boolean).join(' ')}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => !option.disabled && selectOption(option)}
              >
                <span>{option.label}</span>
                {selected && (
                  <svg className="ui-select__check" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                    <path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
