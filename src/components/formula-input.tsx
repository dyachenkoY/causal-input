"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useFormulaStore } from "@/lib/store"
import { calculateFormula } from "@/lib/formula-calculator"
import { ChevronDown, Loader2, X } from "lucide-react"
import { fetchSuggestions } from "@/lib/api"
import { useDebouncedValue } from "@/lib/hooks"

export default function FormulaInput() {
    const {
        formula,
        tags,
        cursorPosition,
        addTag,
        removeTag,
        updateFormula,
        setCursorPosition,
        setActiveTagIndex,
        activeTagIndex,
    } = useFormulaStore()

    const [inputValue, setInputValue] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [result, setResult] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tagDropdownPosition, setTagDropdownPosition] = useState<{ top: number; left: number } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const activeTagRef = useRef<HTMLDivElement>(null)

    const debouncedInputValue = useDebouncedValue(inputValue, 300)

    const {
        data: suggestions = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["suggestions", debouncedInputValue],
        queryFn: () => fetchSuggestions(debouncedInputValue),
        enabled: debouncedInputValue.length > 0 && showSuggestions,
        staleTime: 60000,
        refetchOnWindowFocus: false,
        retry: 1,
        retryDelay: 1000,
    })


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)

        if (value.trim()) {
            setShowSuggestions(true)
        } else {
            setShowSuggestions(false)
        }
    }


    const handleSelectSuggestion = (suggestion: { id: number; name: string; value: number }) => {
        addTag({
            id: suggestion.id,
            name: suggestion.name,
            value: suggestion.value,
            position: cursorPosition,
        })
        setInputValue("")
        setShowSuggestions(false)


        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus()
            }
        }, 0)
    }


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && inputValue === "") {
            const tagBeforeCursor = tags
                .filter((tag) => tag.position < cursorPosition)
                .sort((a, b) => b.position - a.position)[0]

            if (tagBeforeCursor && cursorPosition === tagBeforeCursor.position + tagBeforeCursor.name.length) {
                removeTag(tagBeforeCursor.id)
                e.preventDefault()
                return
            }
        }

        if (e.key === "Backspace") {
            const prevChar = formula[cursorPosition - 1]
            const operators = ["+", "-", "*", "/", "(", ")", "^"]

            if (operators.includes(prevChar)) {
                updateFormula(formula.slice(0, cursorPosition - 1) + formula.slice(cursorPosition))
                setCursorPosition(cursorPosition - 1)
                e.preventDefault()
                return
            }
        }

        const operators = ["+", "-", "*", "/", "(", ")", "^"]
        if (operators.includes(e.key)) {
            updateFormula(formula.slice(0, cursorPosition) + e.key + formula.slice(cursorPosition))
            setCursorPosition(cursorPosition + 1)

            setInputValue("")
            setShowSuggestions(true)

            e.preventDefault()
            return
        }

        if (/^[0-9]$/.test(e.key)) {
            updateFormula(formula.slice(0, cursorPosition) + e.key + formula.slice(cursorPosition))
            setCursorPosition(cursorPosition + 1)
            e.preventDefault()
            return
        }

        if (e.key === "ArrowLeft") {
            if (cursorPosition > 0) {
                setCursorPosition(cursorPosition - 1)
                e.preventDefault()
            }
            return
        }

        if (e.key === "ArrowRight") {
            if (cursorPosition < formula.length) {
                setCursorPosition(cursorPosition + 1)
                e.preventDefault()
            }
            return
        }

        if (e.key === "ArrowDown" && showSuggestions && suggestions.length > 0) {
            // Focus the first suggestion
            const suggestionsList = document.querySelector(".suggestions-list")
            const firstSuggestion = suggestionsList?.querySelector("li")
            if (firstSuggestion instanceof HTMLElement) {
                firstSuggestion.focus()
                e.preventDefault()
            }
            return
        }

        if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
            handleSelectSuggestion(suggestions[0])
            e.preventDefault()
            return
        }

        if (e.key === "Escape" && showSuggestions) {
            setShowSuggestions(false)
            e.preventDefault()
            return
        }
    }

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === containerRef.current && inputRef.current) {
            inputRef.current.focus()
            setCursorPosition(formula.length)
        }
    }

    const handleTextClick = (position: number) => {
        setCursorPosition(position)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    useEffect(() => {
        try {
            setError(null)
            const calculatedResult = calculateFormula(formula, tags)
            setResult(calculatedResult)
        } catch (error) {
            setResult(null)
            setError(error instanceof Error ? error.message : "Error calculating formula")
        }
    }, [formula, tags])

    useEffect(() => {
        if (inputRef.current) {
            const input = inputRef.current

            input.setSelectionRange(cursorPosition, cursorPosition)
        }
    }, [cursorPosition])

    useEffect(() => {
        if (activeTagIndex !== null && activeTagRef.current) {
            const rect = activeTagRef.current.getBoundingClientRect()
            setTagDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            })
        } else {
            setTagDropdownPosition(null)
        }
    }, [activeTagIndex])

    const renderFormula = () => {
        let lastIndex = 0
        const elements = []

        const sortedTags = [...tags].sort((a, b) => a.position - b.position)

        for (const tag of sortedTags) {
            if (tag.position > lastIndex) {
                const textBeforeTag = formula.slice(lastIndex, tag.position)
                elements.push(
                    <span
                        key={`text-${lastIndex}`}
                        className="whitespace-pre cursor-text"
                        onClick={() => handleTextClick(lastIndex)}
                    >
            {textBeforeTag}
          </span>,
                )
            }

            elements.push(
                <div
                    key={`tag-${tag.id}`}
                    onClick={() => {
                        setActiveTagIndex(activeTagIndex === tag.id ? null : tag.id)
                    }}
                    ref={activeTagIndex === tag.id ? activeTagRef : null}
                >
                    {tag.name}
                    <button
                        className="ml-1 rounded hover:bg-blue-200"
                        onClick={(e) => {
                            e.stopPropagation()
                            setActiveTagIndex(activeTagIndex === tag.id ? null : tag.id)
                        }}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>,
            )

            lastIndex = tag.position + tag.name.length
        }

        if (lastIndex < formula.length) {
            const remainingText = formula.slice(lastIndex)
            elements.push(
                <span
                    key={`text-${lastIndex}`}
                    className="whitespace-pre cursor-text"
                    onClick={() => handleTextClick(lastIndex)}
                >
          {remainingText}
        </span>,
            )
        }

        elements.push(
            <span key="cursor-indicator" className="relative" style={{ left: 0 }}>
        <span
            style={{ left: 0 }}
        />
      </span>,
        )

        return elements
    }

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                className="relative flex min-h-[40px] w-full items-center rounded-md border border-gray-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                onClick={handleContainerClick}
            >
                <div className="flex flex-wrap items-center gap-1">
                    {renderFormula()}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="flex-grow border-none bg-transparent outline-none"
                        placeholder={tags.length === 0 ? "Start typing to add variables..." : ""}
                        onFocus={() => {
                            if (cursorPosition === 0 && formula.length > 0) {
                                setCursorPosition(formula.length)
                            }
                        }}
                    />
                </div>

                {showSuggestions && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-500">Loading suggestions...</span>
                            </div>
                        ) : isError ? (
                            <div className="p-4">
                                <p className="text-sm text-amber-600 mb-1">Using local suggestions (API unavailable)</p>
                                <ul className="suggestions-list max-h-60 overflow-auto py-1">
                                    {suggestions.map((suggestion) => (
                                        <li
                                            key={suggestion.id}
                                            className="cursor-pointer px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                            onClick={() => handleSelectSuggestion(suggestion)}
                                            tabIndex={0}
                                        >
                                            <div className="flex justify-between">
                                                <span>{suggestion.name}</span>
                                                <span className="text-gray-400">{suggestion.value}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No suggestions found. Try a different search term.</div>
                        ) : (
                            <ul className="suggestions-list max-h-60 overflow-auto py-1">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={Math.random()}
                                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSelectSuggestion(suggestion)
                                            } else if (e.key === "ArrowDown") {
                                                const nextSibling = e.currentTarget.nextElementSibling
                                                if (nextSibling instanceof HTMLElement) {
                                                    nextSibling.focus()
                                                    e.preventDefault()
                                                }
                                            } else if (e.key === "ArrowUp") {
                                                const prevSibling = e.currentTarget.previousElementSibling
                                                if (prevSibling instanceof HTMLElement) {
                                                    prevSibling.focus()
                                                } else {
                                                    inputRef.current?.focus()
                                                }
                                                e.preventDefault()
                                            } else if (e.key === "Escape") {
                                                setShowSuggestions(false)
                                                inputRef.current?.focus()
                                                e.preventDefault()
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <span>{suggestion.name}</span>
                                            <span className="text-gray-400">{suggestion.value}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>


            {result !== null && (
                <div className="rounded-md bg-gray-100 p-2">
                    <p className="text-sm font-medium">Result: {result}</p>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-red-50 p-2 text-red-600">
                    <p className="text-sm font-medium">Error: {error}</p>
                </div>
            )}

            {activeTagIndex !== null && tagDropdownPosition && (
                <div
                    className="absolute rounded-md border border-gray-200 bg-white p-3 shadow-md z-20"
                    style={{
                        top: `${tagDropdownPosition.top}px`,
                        left: `${tagDropdownPosition.left}px`,
                        minWidth: "200px",
                    }}
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">{tags.find((t) => t.id === activeTagIndex)?.name}</h3>
                            <button className="rounded-full p-1 hover:bg-gray-100" onClick={() => setActiveTagIndex(null)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500">Current Value</p>
                                <p className="font-mono">{tags.find((t) => t.id === activeTagIndex)?.value}</p>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Actions</p>
                                <div className="flex gap-2">
                                    <button
                                        className="text-sm px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                        onClick={() => {
                                            if (activeTagIndex !== null) {
                                                removeTag(activeTagIndex)
                                                setActiveTagIndex(null)
                                            }
                                        }}
                                    >
                                        Remove
                                    </button>
                                    <button
                                        className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        onClick={() => setActiveTagIndex(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

