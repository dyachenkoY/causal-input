interface Suggestion {
    id: number
    name: string
    value: number
}

export async function fetchSuggestions(searchTerm: string): Promise<Suggestion[]> {
    if (!searchTerm.trim()) {
        return []
    }

    const apiEndpoints = [
        `https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete?search=${encodeURIComponent(searchTerm)}`,
        `https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete?q=${encodeURIComponent(searchTerm)}`,
        `https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete`,
        `https://652f91320b8d8ddac0b2b62b.mockapi.io/api/autocomplete?search=${encodeURIComponent(searchTerm)}`,
    ]

    for (const endpoint of apiEndpoints) {
        try {
            console.log(`Trying API endpoint: ${endpoint}`)
            const response = await fetch(endpoint)

            if (response.ok) {
                const data = await response.json()

                if (Array.isArray(data)) {
                    const filteredData = endpoint.includes("?")
                        ? data
                        : data.filter((item) =>
                            (item.name || item.label || item.text || "").toLowerCase().includes(searchTerm.toLowerCase()),
                        )

                    return filteredData.map((item) => ({
                        id: item.id || Math.random(),
                        name: item.name || item.label || item.text || String(item),
                        value: item.value || Number.parseFloat(item.value) || 0,
                    }))
                }

                console.warn("API response is not an array:", data)
            } else {
                console.warn(`API endpoint ${endpoint} returned status: ${response.status}`)
            }
        } catch (error) {
            console.warn(`Error trying endpoint ${endpoint}:`, error)
        }
    }

    console.error("All API endpoints failed. Falling back to mock data.")
    return getMockSuggestions(searchTerm)
}


function getMockSuggestions(searchTerm: string): Suggestion[] {
    const mockData: Suggestion[] = [
        { id: 1, name: "Revenue", value: 1000 },
        { id: 2, name: "Expenses", value: 500 },
        { id: 3, name: "Profit", value: 500 },
        { id: 4, name: "GrowthRate", value: 0.1 },
        { id: 5, name: "TaxRate", value: 0.2 },
        { id: 6, name: "Employees", value: 50 },
        { id: 7, name: "RevenuePerEmployee", value: 20 },
        { id: 8, name: "MarketingBudget", value: 200 },
        { id: 9, name: "SalesForecast", value: 1500 },
        { id: 10, name: "OperatingCosts", value: 300 },
        { id: 11, name: "CustomerAcquisitionCost", value: 50 },
        { id: 12, name: "AverageOrderValue", value: 75 },
        { id: 13, name: "ConversionRate", value: 0.03 },
        { id: 14, name: "ChurnRate", value: 0.05 },
        { id: 15, name: "LifetimeValue", value: 500 },
    ]

    return mockData.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
}

