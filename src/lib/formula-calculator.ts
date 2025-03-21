interface Tag {
    id: number
    name: string
    value: number
    position: number
}

export function calculateFormula(formula: string, tags: Tag[]): number | null {
    try {
        if (!formula.trim()) return null

        let calculableFormula = formula

        const sortedTags = [...tags].sort((a, b) => b.position - a.position)

        for (const tag of sortedTags) {
            calculableFormula =
                calculableFormula.slice(0, tag.position) +
                tag.value.toString() +
                calculableFormula.slice(tag.position + tag.name.length)
        }

        let parenCount = 0
        for (const char of calculableFormula) {
            if (char === "(") parenCount++
            if (char === ")") parenCount--
            if (parenCount < 0) throw new Error("Unbalanced parentheses")
        }
        if (parenCount !== 0) throw new Error("Unbalanced parentheses")

        calculableFormula = calculableFormula.replace(/[+\-*/^]$/, "")

        if (!calculableFormula.trim()) return null

        if (!/^[0-9+\-*/().^ ]+$/.test(calculableFormula)) {
            throw new Error("Formula contains invalid characters")
        }

        const result = Function(`"use strict"; return (${calculableFormula})`)()

        return typeof result === "number" && !isNaN(result) ? result : null
    } catch (error) {
        console.error("Error calculating formula:", error)
        return null
    }
}

