import { create } from "zustand"

interface Tag {
    id: number
    name: string
    value: number
    position: number
}

interface FormulaState {
    formula: string
    tags: Tag[]
    cursorPosition: number
    activeTagIndex: number | null
    updateFormula: (newFormula: string) => void
    addTag: (tag: Tag) => void
    removeTag: (id: number) => void
    setCursorPosition: (position: number) => void
    setActiveTagIndex: (id: number | null) => void
}

export const useFormulaStore = create<FormulaState>((set) => ({
    formula: "",
    tags: [],
    cursorPosition: 0,
    activeTagIndex: null,

    updateFormula: (newFormula) =>
        set((state) => {
            const updatedTags = state.tags.map((tag) => {
                if (state.cursorPosition <= tag.position) {
                    // Calculate the difference in length
                    const lengthDiff = newFormula.length - state.formula.length
                    return { ...tag, position: tag.position + lengthDiff }
                }
                return tag
            })

            return {
                formula: newFormula,
                tags: updatedTags,
            }
        }),

    addTag: (tag) =>
        set((state) => {
            const newTag = { ...tag }

            const newFormula = state.formula.slice(0, tag.position) + tag.name + state.formula.slice(tag.position)

            const updatedTags = state.tags.map((t) => {
                if (t.position >= tag.position) {
                    return { ...t, position: t.position + tag.name.length }
                }
                return t
            })

            updatedTags.push(newTag)

            const newCursorPosition = tag.position + tag.name.length

            return {
                formula: newFormula,
                tags: updatedTags,
                cursorPosition: newCursorPosition,
            }
        }),

    removeTag: (id) =>
        set((state) => {

            const tagToRemove = state.tags.find((t) => t.id === id)
            if (!tagToRemove) return state

            const newFormula =
                state.formula.slice(0, tagToRemove.position) +
                state.formula.slice(tagToRemove.position + tagToRemove.name.length)

            const updatedTags = state.tags
                .filter((t) => t.id !== id)
                .map((t) => {
                    if (t.position > tagToRemove.position) {
                        return { ...t, position: t.position - tagToRemove.name.length }
                    }
                    return t
                })

            const newCursorPosition = tagToRemove.position

            return {
                formula: newFormula,
                tags: updatedTags,
                cursorPosition: newCursorPosition,
            }
        }),

    setCursorPosition: (position) => set({ cursorPosition: position }),

    setActiveTagIndex: (id) => set({ activeTagIndex: id }),
}))

