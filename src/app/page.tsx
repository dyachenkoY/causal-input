import FormulaInput from "@/components/formula-input"

export default function Home() {
  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-3xl font-bold">Formula Input (Causal-style)</h1>
          <p className="text-gray-500">
            Enter a formula using variables (name 1, name 2 etc), numbers, and operators. Try typing something like &#34;Name 1&#34; + &#34;Name 6&#34;.
          </p>
          <FormulaInput />
        </div>
      </main>
  )
}

