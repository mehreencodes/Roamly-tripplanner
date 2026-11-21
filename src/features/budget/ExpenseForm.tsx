import { useEffect, useMemo } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Save } from 'lucide-react'
import { CURRENCIES, formatInput, parseAmount, type CurrencyCode } from '@/lib/money'
import { EXPENSE_CATEGORIES, type Expense } from '@/types/budget'
import type { ExpenseInput } from './budgetStore'
import { categoryMeta } from './categoryMeta'

const makeSchema = (currency: CurrencyCode) =>
  z.object({
    title: z.string().trim().min(1, 'Give it a name').max(60, 'Keep it under 60 characters'),
    category: z.enum(EXPENSE_CATEGORIES),
    day: z.string(),
    estimate: z
      .string()
      .refine((v) => parseAmount(v, currency) !== null, 'Enter a valid amount'),
    actual: z
      .string()
      .refine(
        (v) => v.trim() === '' || parseAmount(v, currency) !== null,
        'Enter a valid amount, or leave it empty',
      ),
  })

type FormValues = z.infer<ReturnType<typeof makeSchema>>

const blank: FormValues = { title: '', category: 'food', day: 'all', estimate: '', actual: '' }

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition focus:ring-2 ${
    invalid
      ? 'border-red-400 focus:ring-red-200'
      : 'border-sand focus:border-terracotta focus:ring-terracotta/20'
  }`

function AmountField({
  id,
  label,
  hint,
  error,
  currency,
  registration,
}: {
  id: string
  label: string
  hint: string
  error?: string
  currency: CurrencyCode
  registration: UseFormRegisterReturn
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
          {currency}
        </span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={!!error}
          className={`${inputClass(!!error)} pl-14`}
          {...registration}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

interface ExpenseFormProps {
  currency: CurrencyCode
  dayOptions: { value: number; label: string }[]
  editing: Expense | null
  /** Edit shuru hone par kaunsa dabba khule (jaise "Record actual" par actual) */
  autoFocus?: 'title' | 'actual'
  onSubmit: (input: ExpenseInput) => void
  onCancel: () => void
}

export default function ExpenseForm({
  currency,
  dayOptions,
  editing,
  autoFocus,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const schema = useMemo(() => makeSchema(currency), [currency])

  const defaults: FormValues = editing
    ? {
        title: editing.title,
        category: editing.category,
        day: editing.dayIndex === null ? 'all' : String(editing.dayIndex),
        estimate: formatInput(editing.estimatedMinor, currency),
        actual: editing.actualMinor === null ? '' : formatInput(editing.actualMinor, currency),
      }
    : blank

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults })

  useEffect(() => {
    if (autoFocus) setFocus(autoFocus)
  }, [autoFocus, setFocus])

  const hint = CURRENCIES[currency].digits === 0 ? 'Whole amounts only' : 'Up to 2 decimals'

  const submit = (v: FormValues) => {
    const estimatedMinor = parseAmount(v.estimate, currency)
    if (estimatedMinor === null) return
    const actualText = v.actual.trim()

    onSubmit({
      title: v.title.trim(),
      category: v.category,
      estimatedMinor,
      actualMinor: actualText === '' ? null : parseAmount(actualText, currency),
      dayIndex: v.day === 'all' ? null : Number(v.day),
    })

    if (!editing) {
      // Agla kharch usi din/category mein likhna aasan ho
      reset({ ...blank, category: v.category, day: v.day })
      setFocus('title')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="space-y-4 rounded-3xl border border-sand bg-white p-5"
    >
      <h2 className="font-display text-xl text-forest">
        {editing ? 'Edit expense' : 'Add expense'}
      </h2>

      <div>
        <label htmlFor="expense-title" className="mb-1.5 block text-sm font-medium text-ink">
          What was it?
        </label>
        <input
          id="expense-title"
          autoComplete="off"
          placeholder="Hotel, lunch, entry tickets..."
          aria-invalid={!!errors.title}
          className={inputClass(!!errors.title)}
          {...register('title')}
        />
        {errors.title && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Category</legend>
        <div className="grid grid-cols-3 gap-2">
          {EXPENSE_CATEGORIES.map((c) => {
            const { label, Icon } = categoryMeta[c]
            return (
              <label key={c} className="cursor-pointer">
                <input type="radio" value={c} className="peer sr-only" {...register('category')} />
                <span className="flex flex-col items-center gap-1 rounded-xl border border-sand bg-white px-2 py-2.5 text-xs font-medium text-ink/70 transition hover:border-forest/40 peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta">
                  <Icon size={17} />
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="expense-day" className="mb-1.5 block text-sm font-medium text-ink">
          Which day?
        </label>
        <select id="expense-day" className={inputClass(false)} {...register('day')}>
          <option value="all">Whole trip</option>
          {dayOptions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <AmountField
        id="expense-estimate"
        label="Estimated cost"
        hint={hint}
        error={errors.estimate?.message}
        currency={currency}
        registration={register('estimate')}
      />

      <AmountField
        id="expense-actual"
        label="Actual cost (optional)"
        hint="Leave empty if you have not paid yet"
        error={errors.actual?.message}
        currency={currency}
        registration={register('actual')}
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-terracotta py-3 font-medium text-white transition hover:bg-terracotta/90 active:scale-[0.98]"
        >
          {editing ? <Save size={17} /> : <Plus size={17} />}
          {editing ? 'Save changes' : 'Add expense'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-forest/20 px-5 py-3 text-sm font-medium text-forest transition hover:bg-sand active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}