import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { sortedEmployees, Employee } from '@/data/employees';

interface EmployeeComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function EmployeeCombobox({ value, onChange }: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [showNewIdInput, setShowNewIdInput] = useState(false);
  const [newId, setNewId] = useState('');

  const selectedEmployee = useMemo(() => {
    return sortedEmployees.find((emp) => emp.biometricId === value);
  }, [value]);

  const handleSelect = (biometricId: string) => {
    onChange(biometricId);
    setOpen(false);
    setShowNewIdInput(false);
  };

  const handleNewIdSubmit = () => {
    if (newId.trim()) {
      onChange(newId.trim());
      setShowNewIdInput(false);
      setNewId('');
      setOpen(false);
    }
  };

  const displayValue = selectedEmployee
    ? `${selectedEmployee.name} (${selectedEmployee.biometricId})`
    : value
    ? `ID: ${value}`
    : 'Select employee or enter ID...';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal h-auto min-h-10 py-2"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or ID..." />
          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup heading="Employees">
              {sortedEmployees.map((employee) => (
                <CommandItem
                  key={employee.biometricId}
                  value={`${employee.name} ${employee.biometricId}`}
                  onSelect={() => handleSelect(employee.biometricId)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === employee.biometricId ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{employee.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {employee.biometricId}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Custom ID">
              {showNewIdInput ? (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Enter biometric ID..."
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNewIdSubmit();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleNewIdSubmit}
                      disabled={!newId.trim()}
                    >
                      Use ID
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewIdInput(false);
                        setNewId('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <CommandItem
                  onSelect={() => setShowNewIdInput(true)}
                  className="cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enter new ID manually
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
