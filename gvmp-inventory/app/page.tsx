"use client"

import { useEffect, useMemo, useState } from "react"
import { get, set } from "idb-keyval"

type TabKey =
  | "overview"
  | "storage"
  | "calculator"
  | "prices"
  | "create"
  | "trade"
  | "dealers"

type Item = {
  id: string
  name: string
  image: string
  defaultAmount?: number | null
  defaultKg?: number | null
  stackSize?: number | null
  priceBlack?: number | null
  priceGreen?: number | null
  useDealerPricing?: boolean | null
}

type VehicleInventoryEntry = {
  item: Item
  amount?: number | null
  kg?: number | null
}

type Vehicle = {
  id: string
  name: string
  image: string
  plate: string
  location: string
  note: string
  maxKg?: number | null
  maxSlots?: number | null
  inventory: VehicleInventoryEntry[]
}

type Dealer = {
  id: string
  name: string
  image: string
  location: string
  stage: 1 | 2 | 3 | 4
  cratePriceBlack: number
  isActive: boolean
  extraItems: {
    itemId: string
    priceBlack: number
  }[]
}

type TradeResultModal = {
  title: string
  message: string
  lines?: string[]
  variant?: "success" | "warning" | "error" | "info"
} | null

type DealerCalcModal = {
  dealerId: string
  amount: string
} | null

const ITEMS_KEY = "escocars_storage_items_db_v1"
const VEHICLES_KEY = "escocars_storage_vehicles_db_v1"
const DEALERS_KEY = "escocars_storage_dealers_db_v1"

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("storage")

  const [items, setItems] = useState<Item[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [assignVehicleId, setAssignVehicleId] = useState("")
  const [assignAmount, setAssignAmount] = useState("1")

  const [vehicleSearch, setVehicleSearch] = useState("")

  const [itemName, setItemName] = useState("")
  const [itemImageBase64, setItemImageBase64] = useState("")
  const [itemDefaultAmount, setItemDefaultAmount] = useState("")
  const [itemDefaultKg, setItemDefaultKg] = useState("")
  const [itemStackSize, setItemStackSize] = useState("")
  const [itemPriceBlack, setItemPriceBlack] = useState("")
  const [itemPriceGreen, setItemPriceGreen] = useState("")
  const [itemUseDealerPricing, setItemUseDealerPricing] = useState(false)

  const [vehName, setVehName] = useState("")
  const [vehImageBase64, setVehImageBase64] = useState("")
  const [vehPlate, setVehPlate] = useState("")
  const [vehLocation, setVehLocation] = useState("")
  const [vehNote, setVehNote] = useState("")
  const [vehMaxKg, setVehMaxKg] = useState("")
  const [vehMaxSlots, setVehMaxSlots] = useState("")

  const [dealerName, setDealerName] = useState("")
  const [dealerImageBase64, setDealerImageBase64] = useState("")
  const [dealerLocation, setDealerLocation] = useState("")
  const [dealerStage, setDealerStage] = useState<1 | 2 | 3 | 4>(1)
  const [dealerCratePriceBlack, setDealerCratePriceBlack] = useState("")
  const [dealerExtraItems, setDealerExtraItems] = useState<{ itemId: string; priceBlack: number }[]>([])
  const [dealerItemPriceModal, setDealerItemPriceModal] = useState<{
  mode: "create" | "edit"
  itemId: string
  price: string
} | null>(null)
  const [dealerIsActive, setDealerIsActive] = useState(true)

  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [editItemName, setEditItemName] = useState("")
  const [editItemDefaultAmount, setEditItemDefaultAmount] = useState("")
  const [editItemDefaultKg, setEditItemDefaultKg] = useState("")
  const [editItemStackSize, setEditItemStackSize] = useState("")
  const [editItemPriceBlack, setEditItemPriceBlack] = useState("")
  const [editItemPriceGreen, setEditItemPriceGreen] = useState("")
  const [editItemImageBase64, setEditItemImageBase64] = useState("")
  const [editItemUseDealerPricing, setEditItemUseDealerPricing] = useState(false)

  const [editVehicleId, setEditVehicleId] = useState<string | null>(null)
  const [editVehName, setEditVehName] = useState("")
  const [editVehPlate, setEditVehPlate] = useState("")
  const [editVehLocation, setEditVehLocation] = useState("")
  const [editVehNote, setEditVehNote] = useState("")
  const [editVehMaxKg, setEditVehMaxKg] = useState("")
  const [editVehMaxSlots, setEditVehMaxSlots] = useState("")
  const [editVehImageBase64, setEditVehImageBase64] = useState("")

  const [editDealerId, setEditDealerId] = useState<string | null>(null)
  const [editDealerName, setEditDealerName] = useState("")
  const [editDealerImageBase64, setEditDealerImageBase64] = useState("")
  const [editDealerLocation, setEditDealerLocation] = useState("")
  const [editDealerStage, setEditDealerStage] = useState<1 | 2 | 3 | 4>(1)
  const [editDealerCratePriceBlack, setEditDealerCratePriceBlack] = useState("")
  const [editDealerExtraItems, setEditDealerExtraItems] = useState<{ itemId: string; priceBlack: number }[]>([])
  const [editDealerIsActive, setEditDealerIsActive] = useState(true)

  const [calcItemId, setCalcItemId] = useState("")
  const [calcAmount, setCalcAmount] = useState("1")

  const [tradeItemId, setTradeItemId] = useState("")
  const [tradeAmount, setTradeAmount] = useState("1")
  const [tradeVehicleIds, setTradeVehicleIds] = useState<string[]>([])
  const [tradeResultModal, setTradeResultModal] = useState<TradeResultModal>(null)

  const [dealerCalcModal, setDealerCalcModal] = useState<DealerCalcModal>(null)

  const isCrateItemName = (name: string) => {
  const n = name.trim().toLowerCase()
  return n === "kiste" || n === "kisten"
}

const dealerSupportsItem = (dealer: Dealer, item: Item) => {
  if (isCrateItemName(item.name)) return true
  return dealer.extraItems.some((entry) => entry.itemId === item.id)
}

const getDealerPriceForItem = (dealer: Dealer, item: Item) => {
  if (isCrateItemName(item.name)) return dealer.cratePriceBlack

  const found = dealer.extraItems.find((entry) => entry.itemId === item.id)
  return found ? found.priceBlack : null
}

const openDealerItemPriceModal = (mode: "create" | "edit", itemId: string, currentPrice?: number) => {
  setDealerItemPriceModal({
    mode,
    itemId,
    price: currentPrice !== undefined ? String(currentPrice) : "",
  })
}

const saveDealerItemPrice = () => {
  if (!dealerItemPriceModal) return

  const parsedPrice = Math.max(0, Number(dealerItemPriceModal.price) || 0)
  if (parsedPrice <= 0) return

  if (dealerItemPriceModal.mode === "create") {
    setDealerExtraItems((prev) => {
      const exists = prev.find((entry) => entry.itemId === dealerItemPriceModal.itemId)
      if (exists) {
        return prev.map((entry) =>
          entry.itemId === dealerItemPriceModal.itemId
            ? { ...entry, priceBlack: parsedPrice }
            : entry
        )
      }
      return [...prev, { itemId: dealerItemPriceModal.itemId, priceBlack: parsedPrice }]
    })
  } else {
    setEditDealerExtraItems((prev) => {
      const exists = prev.find((entry) => entry.itemId === dealerItemPriceModal.itemId)
      if (exists) {
        return prev.map((entry) =>
          entry.itemId === dealerItemPriceModal.itemId
            ? { ...entry, priceBlack: parsedPrice }
            : entry
        )
      }
      return [...prev, { itemId: dealerItemPriceModal.itemId, priceBlack: parsedPrice }]
    })
  }

  setDealerItemPriceModal(null)
}

const removeDealerExtraItem = (mode: "create" | "edit", itemId: string) => {
  if (mode === "create") {
    setDealerExtraItems((prev) => prev.filter((entry) => entry.itemId !== itemId))
  } else {
    setEditDealerExtraItems((prev) => prev.filter((entry) => entry.itemId !== itemId))
  }
}

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedItems = await get<Item[]>(ITEMS_KEY)
        const savedVehicles = await get<Vehicle[]>(VEHICLES_KEY)
        const savedDealers = await get<Dealer[]>(DEALERS_KEY)

        if (savedItems) {
          setItems(
            savedItems.map((item) => ({
              ...item,
              defaultAmount: item.defaultAmount ?? null,
              defaultKg: item.defaultKg ?? null,
              stackSize: item.stackSize ?? null,
              priceBlack: item.priceBlack ?? null,
              priceGreen: item.priceGreen ?? null,
              useDealerPricing: item.useDealerPricing ?? false,
            }))
          )
        }

        if (savedVehicles) {
          setVehicles(
            savedVehicles.map((vehicle) => ({
              ...vehicle,
              maxKg: vehicle.maxKg ?? null,
              maxSlots: vehicle.maxSlots ?? null,
              inventory: (vehicle.inventory || []).map((entry) => ({
                ...entry,
                amount: entry.amount ?? null,
                kg: entry.kg ?? null,
              })),
            }))
          )
        }

        if (savedDealers) {
  setDealers(
    savedDealers.map((dealer) => ({
      ...dealer,
      extraItems: dealer.extraItems ?? [],
      isActive: dealer.isActive ?? true,
    }))
  )
}
      } catch (error) {
        console.error("Fehler beim Laden:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    set(ITEMS_KEY, items).catch((error) => {
      console.error("Fehler beim Speichern der Items:", error)
    })
  }, [items, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    set(VEHICLES_KEY, vehicles).catch((error) => {
      console.error("Fehler beim Speichern der Fahrzeuge:", error)
    })
  }, [vehicles, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    set(DEALERS_KEY, dealers).catch((error) => {
      console.error("Fehler beim Speichern der Dealer:", error)
    })
  }, [dealers, isLoaded])

  const activeDealers = useMemo(
    () => dealers.filter((dealer) => dealer.isActive),
    [dealers]
  )

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null
    return vehicles.find((v) => v.id === selectedVehicleId) || null
  }, [selectedVehicleId, vehicles])

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase().trim()
    if (!q) return vehicles
    return vehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.note.toLowerCase().includes(q)
    )
  }, [vehicles, vehicleSearch])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-"
    const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2))
    return rounded.toLocaleString("de-DE")
  }

  const formatMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-"
    return `${Math.round(value).toLocaleString("de-DE")}$`
  }

  const getConversionRatio = (item: Item) => {
    const hasAmount =
      item.defaultAmount !== null &&
      item.defaultAmount !== undefined &&
      item.defaultAmount > 0
    const hasKg =
      item.defaultKg !== null &&
      item.defaultKg !== undefined &&
      item.defaultKg > 0

    if (!hasAmount || !hasKg) return null
    return item.defaultKg! / item.defaultAmount!
  }

  const getItemSlotsForAmount = (item: Item, amount?: number | null) => {
    const safeAmount = amount || 0
    if (safeAmount <= 0) return 0
    const stack = item.stackSize || 0
    if (stack > 0) return Math.ceil(safeAmount / stack)
    return safeAmount
  }

  const getVehicleCurrentKg = (vehicle: Vehicle) =>
    vehicle.inventory.reduce((sum, entry) => sum + (entry.kg || 0), 0)

  const getVehicleUsedSlots = (vehicle: Vehicle) =>
    vehicle.inventory.reduce(
      (sum, entry) => sum + getItemSlotsForAmount(entry.item, entry.amount),
      0
    )

  const getDealerPricesForItem = (item: Item) => {
  if (!item.useDealerPricing) return null

  const supportedDealers = activeDealers.filter((dealer) => dealerSupportsItem(dealer, item))

  if (supportedDealers.length === 0) return null

  const blackPrices = supportedDealers
    .map((dealer) => getDealerPriceForItem(dealer, item))
    .filter((price): price is number => price !== null)

  if (blackPrices.length === 0) return null

  const minBlack = Math.min(...blackPrices)
  const maxBlack = Math.max(...blackPrices)

  return {
    minBlack,
    maxBlack,
    minGreen: minBlack * 0.8,
    maxGreen: maxBlack * 0.8,
    minDealer:
      supportedDealers.find((dealer) => getDealerPriceForItem(dealer, item) === minBlack) || null,
    maxDealer:
      supportedDealers.find((dealer) => getDealerPriceForItem(dealer, item) === maxBlack) || null,
  }
}

  const getItemPrices = (item: Item) => {
    const dealerPrices = getDealerPricesForItem(item)
    if (dealerPrices) {
      return {
        black: dealerPrices.minBlack,
        green: dealerPrices.minGreen,
        dealerMinBlack: dealerPrices.minBlack,
        dealerMaxBlack: dealerPrices.maxBlack,
        dealerMinGreen: dealerPrices.minGreen,
        dealerMaxGreen: dealerPrices.maxGreen,
        dealerMode: true,
      }
    }

    let black = item.priceBlack ?? null
    let green = item.priceGreen ?? null

    if ((black === null || black === undefined) && green !== null && green !== undefined) {
      black = green / 0.8
    }

    if ((green === null || green === undefined) && black !== null && black !== undefined) {
      green = black * 0.8
    }

    return {
      black,
      green,
      dealerMinBlack: null,
      dealerMaxBlack: null,
      dealerMinGreen: null,
      dealerMaxGreen: null,
      dealerMode: false,
    }
  }

  const getEntryValues = (entry: VehicleInventoryEntry) => {
    const prices = getItemPrices(entry.item)
    const amount = entry.amount || 0

    if (prices.dealerMode) {
      return {
        black: prices.dealerMinBlack !== null ? prices.dealerMinBlack * amount : null,
        green: prices.dealerMinGreen !== null ? prices.dealerMinGreen * amount : null,
        maxBlack: prices.dealerMaxBlack !== null ? prices.dealerMaxBlack * amount : null,
        maxGreen: prices.dealerMaxGreen !== null ? prices.dealerMaxGreen * amount : null,
        dealerMode: true,
      }
    }

    return {
      black: prices.black !== null ? prices.black * amount : null,
      green: prices.green !== null ? prices.green * amount : null,
      maxBlack: null,
      maxGreen: null,
      dealerMode: false,
    }
  }

  const getItemStacks = (item: Item, amount?: number | null) => {
    if (!item.stackSize || item.stackSize <= 0 || !amount || amount <= 0) return null
    return Math.ceil(amount / item.stackSize)
  }

  const getAvailableAmountForVehicle = (vehicle: Vehicle, item: Item) => {
    const ratio = getConversionRatio(item)
    const existingEntry = vehicle.inventory.find((e) => e.item.id === item.id)
    const existingAmount = existingEntry?.amount || 0

    let maxByKg = Number.POSITIVE_INFINITY
    if (vehicle.maxKg && vehicle.maxKg > 0 && ratio !== null) {
      const remainingKg = Math.max(0, vehicle.maxKg - getVehicleCurrentKg(vehicle))
      maxByKg = Math.floor(remainingKg / ratio)
    }

    let maxBySlots = Number.POSITIVE_INFINITY
    if (vehicle.maxSlots && vehicle.maxSlots > 0) {
      const totalUsedSlots = getVehicleUsedSlots(vehicle)
      const remainingSlots = Math.max(0, vehicle.maxSlots - totalUsedSlots)

      if (item.stackSize && item.stackSize > 0) {
        const currentRemainder =
          existingAmount > 0 && existingAmount % item.stackSize !== 0
            ? item.stackSize - (existingAmount % item.stackSize)
            : 0

        maxBySlots = currentRemainder + remainingSlots * item.stackSize
      } else {
        maxBySlots = remainingSlots
      }
    }

    const minCap = Math.min(maxByKg, maxBySlots)
    if (!Number.isFinite(minCap)) return Number.MAX_SAFE_INTEGER
    return Math.max(0, Math.floor(minCap))
  }

  const updateEntryDerivedValues = (item: Item, amount: number) => {
    const ratio = getConversionRatio(item)
    return {
      amount,
      kg: ratio !== null ? amount * ratio : null,
    }
  }

  const handleItemImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    if (target === "create") setItemImageBase64(base64)
    else setEditItemImageBase64(base64)
  }

  const handleVehicleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    if (target === "create") setVehImageBase64(base64)
    else setEditVehImageBase64(base64)
  }

  const handleDealerImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "create" | "edit"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    if (target === "create") setDealerImageBase64(base64)
    else setEditDealerImageBase64(base64)
  }


  const createItem = () => {
    if (!itemName.trim() || !itemImageBase64) return

    let priceBlack =
      itemPriceBlack.trim() !== "" ? Math.max(0, Number(itemPriceBlack) || 0) : null
    let priceGreen =
      itemPriceGreen.trim() !== "" ? Math.max(0, Number(itemPriceGreen) || 0) : null

    if ((priceBlack === null || priceBlack === 0) && priceGreen && priceGreen > 0) {
      priceBlack = priceGreen / 0.8
    }
    if ((priceGreen === null || priceGreen === 0) && priceBlack && priceBlack > 0) {
      priceGreen = priceBlack * 0.8
    }

    const autoDealerFlag =
      itemUseDealerPricing ||
      itemName.trim().toLowerCase() === "kiste" ||
      itemName.trim().toLowerCase() === "kisten"

    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: itemName.trim(),
        image: itemImageBase64,
        defaultAmount:
          itemDefaultAmount.trim() !== ""
            ? Math.max(0, Number(itemDefaultAmount) || 0)
            : null,
        defaultKg:
          itemDefaultKg.trim() !== ""
            ? Math.max(0, Number(itemDefaultKg) || 0)
            : null,
        stackSize:
          itemStackSize.trim() !== ""
            ? Math.max(0, Number(itemStackSize) || 0)
            : null,
        priceBlack,
        priceGreen,
        useDealerPricing: autoDealerFlag,
      },
    ])

    setItemName("")
    setItemImageBase64("")
    setItemDefaultAmount("")
    setItemDefaultKg("")
    setItemStackSize("")
    setItemPriceBlack("")
    setItemPriceGreen("")
    setItemUseDealerPricing(false)
    const el = document.getElementById("itemFileInput") as HTMLInputElement | null
    if (el) el.value = ""
  }

  const createVehicle = () => {
    if (!vehName.trim() || !vehImageBase64) return

    setVehicles((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: vehName.trim(),
        image: vehImageBase64,
        plate: vehPlate.trim(),
        location: vehLocation.trim(),
        note: vehNote.trim(),
        maxKg:
          vehMaxKg.trim() !== "" ? Math.max(0, Number(vehMaxKg) || 0) : null,
        maxSlots:
          vehMaxSlots.trim() !== "" ? Math.max(0, Number(vehMaxSlots) || 0) : null,
        inventory: [],
      },
    ])

    setVehName("")
    setVehImageBase64("")
    setVehPlate("")
    setVehLocation("")
    setVehNote("")
    setVehMaxKg("")
    setVehMaxSlots("")
    const el = document.getElementById("vehFileInput") as HTMLInputElement | null
    if (el) el.value = ""
  }

  const createDealer = () => {
  if (!dealerName.trim() || !dealerImageBase64 || !dealerLocation.trim() || !dealerCratePriceBlack.trim()) return

  setDealers((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      name: dealerName.trim(),
      image: dealerImageBase64,
      location: dealerLocation.trim(),
      stage: dealerStage,
      cratePriceBlack: Math.max(0, Number(dealerCratePriceBlack) || 0),
      isActive: dealerIsActive,
      extraItems: dealerExtraItems,
    },
  ])

  setDealerName("")
  setDealerImageBase64("")
  setDealerLocation("")
  setDealerStage(1)
  setDealerCratePriceBlack("")
  setDealerExtraItems([])
  setDealerIsActive(true)

  const el = document.getElementById("dealerFileInput") as HTMLInputElement | null
  if (el) el.value = ""
}

  const startEditItem = (item: Item) => {
    setEditItemId(item.id)
    setEditItemName(item.name)
    setEditItemDefaultAmount(item.defaultAmount?.toString() || "")
    setEditItemDefaultKg(item.defaultKg?.toString() || "")
    setEditItemStackSize(item.stackSize?.toString() || "")
    setEditItemPriceBlack(item.priceBlack?.toString() || "")
    setEditItemPriceGreen(item.priceGreen?.toString() || "")
    setEditItemImageBase64(item.image)
    setEditItemUseDealerPricing(Boolean(item.useDealerPricing))
  }

  const saveEditItem = () => {
    if (!editItemId || !editItemName.trim() || !editItemImageBase64) return

    let priceBlack =
      editItemPriceBlack.trim() !== ""
        ? Math.max(0, Number(editItemPriceBlack) || 0)
        : null
    let priceGreen =
      editItemPriceGreen.trim() !== ""
        ? Math.max(0, Number(editItemPriceGreen) || 0)
        : null

    if ((priceBlack === null || priceBlack === 0) && priceGreen && priceGreen > 0) {
      priceBlack = priceGreen / 0.8
    }
    if ((priceGreen === null || priceGreen === 0) && priceBlack && priceBlack > 0) {
      priceGreen = priceBlack * 0.8
    }

    const updatedItem: Item = {
      id: editItemId,
      name: editItemName.trim(),
      image: editItemImageBase64,
      defaultAmount:
        editItemDefaultAmount.trim() !== ""
          ? Math.max(0, Number(editItemDefaultAmount) || 0)
          : null,
      defaultKg:
        editItemDefaultKg.trim() !== ""
          ? Math.max(0, Number(editItemDefaultKg) || 0)
          : null,
      stackSize:
        editItemStackSize.trim() !== ""
          ? Math.max(0, Number(editItemStackSize) || 0)
          : null,
      priceBlack,
      priceGreen,
      useDealerPricing: editItemUseDealerPricing,
    }

    setItems((prev) => prev.map((item) => (item.id === editItemId ? updatedItem : item)))
    setVehicles((prev) =>
      prev.map((vehicle) => ({
        ...vehicle,
        inventory: vehicle.inventory.map((entry) =>
          entry.item.id === editItemId
            ? {
                ...entry,
                item: updatedItem,
                ...updateEntryDerivedValues(updatedItem, entry.amount || 0),
              }
            : entry
        ),
      }))
    )

    setEditItemId(null)
  }

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditVehicleId(vehicle.id)
    setEditVehName(vehicle.name)
    setEditVehPlate(vehicle.plate)
    setEditVehLocation(vehicle.location)
    setEditVehNote(vehicle.note)
    setEditVehMaxKg(vehicle.maxKg?.toString() || "")
    setEditVehMaxSlots(vehicle.maxSlots?.toString() || "")
    setEditVehImageBase64(vehicle.image)
  }

  const saveEditVehicle = () => {
    if (!editVehicleId || !editVehName.trim() || !editVehImageBase64) return

    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === editVehicleId
          ? {
              ...vehicle,
              name: editVehName.trim(),
              image: editVehImageBase64,
              plate: editVehPlate.trim(),
              location: editVehLocation.trim(),
              note: editVehNote.trim(),
              maxKg:
                editVehMaxKg.trim() !== ""
                  ? Math.max(0, Number(editVehMaxKg) || 0)
                  : null,
              maxSlots:
                editVehMaxSlots.trim() !== ""
                  ? Math.max(0, Number(editVehMaxSlots) || 0)
                  : null,
            }
          : vehicle
      )
    )

    setEditVehicleId(null)
  }

  const startEditDealer = (dealer: Dealer) => {
  setEditDealerId(dealer.id)
  setEditDealerName(dealer.name)
  setEditDealerImageBase64(dealer.image)
  setEditDealerLocation(dealer.location)
  setEditDealerStage(dealer.stage)
  setEditDealerCratePriceBlack(dealer.cratePriceBlack.toString())
  setEditDealerExtraItems(dealer.extraItems)
  setEditDealerIsActive(dealer.isActive)
}

  const saveEditDealer = () => {
  if (!editDealerId || !editDealerName.trim() || !editDealerImageBase64 || !editDealerLocation.trim() || !editDealerCratePriceBlack.trim()) return

  setDealers((prev) =>
    prev.map((dealer) =>
      dealer.id === editDealerId
        ? {
            ...dealer,
            name: editDealerName.trim(),
            image: editDealerImageBase64,
            location: editDealerLocation.trim(),
            stage: editDealerStage,
            cratePriceBlack: Math.max(0, Number(editDealerCratePriceBlack) || 0),
            extraItems: editDealerExtraItems,
            isActive: editDealerIsActive,
          }
        : dealer
    )
  )

  setEditDealerId(null)
}

  const deleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setVehicles((prev) =>
      prev.map((vehicle) => ({
        ...vehicle,
        inventory: vehicle.inventory.filter((entry) => entry.item.id !== itemId),
      }))
    )
    setDealers((prev) =>
  prev.map((dealer) => ({
    ...dealer,
    extraItems: dealer.extraItems.filter((entry) => entry.itemId !== itemId),
  }))
)

    if (selectedItem?.id === itemId) {
      setSelectedItem(null)
      setShowAssignModal(false)
    }
  }

  const deleteVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId))
    if (selectedVehicleId === vehicleId) setSelectedVehicleId(null)
    if (assignVehicleId === vehicleId) setAssignVehicleId("")
    setTradeVehicleIds((prev) => prev.filter((id) => id !== vehicleId))
  }

  const deleteDealer = (dealerId: string) => {
    setDealers((prev) => prev.filter((dealer) => dealer.id !== dealerId))
    if (dealerCalcModal?.dealerId === dealerId) {
      setDealerCalcModal(null)
    }
  }

  const clearVehicleInventory = (vehicleId: string) => {
    const confirmed = window.confirm("Inventar dieses Fahrzeugs wirklich komplett leeren?")
    if (!confirmed) return

    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, inventory: [] } : vehicle
      )
    )
  }

  const openAssignModal = (item: Item) => {
    setSelectedItem(item)
    setAssignVehicleId(vehicles[0]?.id || "")
    setAssignAmount(
      item.defaultAmount !== null &&
        item.defaultAmount !== undefined &&
        item.defaultAmount > 0
        ? String(item.defaultAmount)
        : "1"
    )
    setShowAssignModal(true)
  }

  const getComputedAssignKg = () => {
    if (!selectedItem) return null
    const ratio = getConversionRatio(selectedItem)
    if (ratio === null) return null
    const amount = Math.max(0, Number(assignAmount) || 0)
    return amount * ratio
  }

  const assignItemToVehicle = () => {
    if (!selectedItem || !assignVehicleId) return

    const parsedAmount = Math.max(0, Number(assignAmount) || 0)
    if (parsedAmount <= 0) return

    setVehicles((prev) =>
      prev.map((vehicle) => {
        if (vehicle.id !== assignVehicleId) return vehicle

        const maxAdd = getAvailableAmountForVehicle(vehicle, selectedItem)
        if (maxAdd <= 0) return vehicle

        const finalAdd = Math.min(parsedAmount, maxAdd)
        const existingEntry = vehicle.inventory.find((entry) => entry.item.id === selectedItem.id)

        if (existingEntry) {
          const nextAmount = (existingEntry.amount || 0) + finalAdd
          return {
            ...vehicle,
            inventory: vehicle.inventory.map((entry) =>
              entry.item.id === selectedItem.id
                ? {
                    ...entry,
                    ...updateEntryDerivedValues(selectedItem, nextAmount),
                  }
                : entry
            ),
          }
        }

        return {
          ...vehicle,
          inventory: [
            ...vehicle.inventory,
            {
              item: selectedItem,
              ...updateEntryDerivedValues(selectedItem, finalAdd),
            },
          ],
        }
      })
    )

    setShowAssignModal(false)
    setSelectedItem(null)
    setAssignAmount("1")
  }

  const changeInventoryAmount = (
    vehicleId: string,
    itemId: string,
    delta: number
  ) => {
    setVehicles((prev) =>
      prev.map((vehicle) => {
        if (vehicle.id !== vehicleId) return vehicle

        const updatedInventory = vehicle.inventory
          .map((entry) => {
            if (entry.item.id !== itemId) return entry

            const currentAmount = entry.amount || 0
            const nextAmount = currentAmount + delta

            if (delta > 0) {
              const maxAdd = getAvailableAmountForVehicle(vehicle, entry.item)
              if (maxAdd <= 0) return entry
              if (nextAmount > currentAmount + maxAdd) {
                return entry
              }
            }

            return {
              ...entry,
              ...updateEntryDerivedValues(entry.item, nextAmount),
            }
          })
          .filter((entry) => (entry.amount || 0) > 0)

        return { ...vehicle, inventory: updatedInventory }
      })
    )
  }

  const exportBackup = () => {
    try {
      const backup = {
        version: 4,
        exportedAt: new Date().toISOString(),
        items,
        vehicles,
        dealers,
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `escocars-backup-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Backup Export fehlgeschlagen:", error)
      alert("Backup konnte nicht exportiert werden.")
    }
  }

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup || !Array.isArray(backup.items) || !Array.isArray(backup.vehicles)) {
        alert("Ungültige Backup Datei.")
        return
      }

      const shouldOverwrite = window.confirm(
        "Willst du wirklich dein aktuelles Lager mit diesem Backup überschreiben?"
      )
      if (!shouldOverwrite) return

      setItems(backup.items)
      setVehicles(backup.vehicles)
      setDealers(Array.isArray(backup.dealers) ? backup.dealers : [])

      await set(ITEMS_KEY, backup.items)
      await set(VEHICLES_KEY, backup.vehicles)
      await set(DEALERS_KEY, Array.isArray(backup.dealers) ? backup.dealers : [])

      alert("Backup erfolgreich importiert.")
    } catch (error) {
      console.error("Backup Import fehlgeschlagen:", error)
      alert("Backup konnte nicht importiert werden.")
    } finally {
      e.target.value = ""
    }
  }

  const overviewData = useMemo(() => {
    const map = new Map<
      string,
      {
        item: Item
        totalAmount: number
        totalKg: number
        totalBlack: number
        totalGreen: number
        totalBlackMax: number | null
        totalGreenMax: number | null
        dealerMode: boolean
      }
    >()

    vehicles.forEach((vehicle) => {
      vehicle.inventory.forEach((entry) => {
        const values = getEntryValues(entry)
        const existing = map.get(entry.item.id)

        if (existing) {
          existing.totalAmount += entry.amount || 0
          existing.totalKg += entry.kg || 0
          existing.totalBlack += values.black || 0
          existing.totalGreen += values.green || 0
          if (values.dealerMode) {
            existing.totalBlackMax = (existing.totalBlackMax || 0) + (values.maxBlack || 0)
            existing.totalGreenMax = (existing.totalGreenMax || 0) + (values.maxGreen || 0)
            existing.dealerMode = true
          }
        } else {
          map.set(entry.item.id, {
            item: entry.item,
            totalAmount: entry.amount || 0,
            totalKg: entry.kg || 0,
            totalBlack: values.black || 0,
            totalGreen: values.green || 0,
            totalBlackMax: values.dealerMode ? values.maxBlack || 0 : null,
            totalGreenMax: values.dealerMode ? values.maxGreen || 0 : null,
            dealerMode: values.dealerMode,
          })
        }
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount)
  }, [vehicles, activeDealers])

  const calcSelectedItem = useMemo(
    () => items.find((item) => item.id === calcItemId) || null,
    [items, calcItemId]
  )

  const calcResult = useMemo(() => {
    if (!calcSelectedItem) return null

    const amount = Math.max(0, Number(calcAmount) || 0)
    const prices = getItemPrices(calcSelectedItem)
    const ratio = getConversionRatio(calcSelectedItem)
    const kg = ratio !== null ? amount * ratio : null
    const stacks = getItemStacks(calcSelectedItem, amount)

    if (prices.dealerMode) {
      return {
        amount,
        kg,
        stacks,
        black: prices.dealerMinBlack !== null ? prices.dealerMinBlack * amount : null,
        green: prices.dealerMinGreen !== null ? prices.dealerMinGreen * amount : null,
        blackMax: prices.dealerMaxBlack !== null ? prices.dealerMaxBlack * amount : null,
        greenMax: prices.dealerMaxGreen !== null ? prices.dealerMaxGreen * amount : null,
        dealerMode: true,
      }
    }

    return {
      amount,
      kg,
      stacks,
      black: prices.black !== null ? prices.black * amount : null,
      green: prices.green !== null ? prices.green * amount : null,
      blackMax: null,
      greenMax: null,
      dealerMode: false,
    }
  }, [calcSelectedItem, calcAmount, activeDealers])

  const tradeSelectedItem = useMemo(
    () => items.find((item) => item.id === tradeItemId) || null,
    [items, tradeItemId]
  )

  const toggleTradeVehicle = (vehicleId: string) => {
    setTradeVehicleIds((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId)
      }
      return [...prev, vehicleId]
    })
  }

  const processTradeBuy = (
    sourceVehicles: Vehicle[],
    item: Item,
    amount: number,
    orderedVehicleIds: string[]
  ) => {
    let remaining = amount
    let totalAdded = 0
    const lines: string[] = []
    const updated = structuredClone(sourceVehicles) as Vehicle[]

    for (const vehicleId of orderedVehicleIds) {
      if (remaining <= 0) break

      const vehicleIndex = updated.findIndex((v) => v.id === vehicleId)
      if (vehicleIndex === -1) continue

      const vehicle = updated[vehicleIndex]
      const maxAdd = getAvailableAmountForVehicle(vehicle, item)

      if (maxAdd <= 0) {
        lines.push(`${vehicle.name}: kein freier Platz für ${item.name}`)
        continue
      }

      const toAdd = Math.min(remaining, maxAdd)
      remaining -= toAdd
      totalAdded += toAdd

      const existingEntry = vehicle.inventory.find((entry) => entry.item.id === item.id)

      if (existingEntry) {
        const nextAmount = (existingEntry.amount || 0) + toAdd
        vehicle.inventory = vehicle.inventory.map((entry) =>
          entry.item.id === item.id
            ? {
                ...entry,
                ...updateEntryDerivedValues(item, nextAmount),
              }
            : entry
        )
      } else {
        vehicle.inventory = [
          ...vehicle.inventory,
          {
            item,
            ...updateEntryDerivedValues(item, toAdd),
          },
        ]
      }

      updated[vehicleIndex] = { ...vehicle }
      lines.push(`${vehicle.name}: ${formatNumber(toAdd)}x eingelagert`)
    }

    return { updatedVehicles: updated, remaining, totalAdded, lines }
  }

  const processTradeSell = (
    sourceVehicles: Vehicle[],
    item: Item,
    amount: number,
    orderedVehicleIds: string[]
  ) => {
    let remaining = amount
    let totalRemoved = 0
    const lines: string[] = []
    const updated = structuredClone(sourceVehicles) as Vehicle[]

    for (const vehicleId of orderedVehicleIds) {
      if (remaining <= 0) break

      const vehicleIndex = updated.findIndex((v) => v.id === vehicleId)
      if (vehicleIndex === -1) continue

      const vehicle = updated[vehicleIndex]
      const existingEntry = vehicle.inventory.find((entry) => entry.item.id === item.id)

      if (!existingEntry || (existingEntry.amount || 0) <= 0) {
        lines.push(`${vehicle.name}: kein ${item.name} vorhanden`)
        continue
      }

      const currentAmount = existingEntry.amount || 0
      const toRemove = Math.min(currentAmount, remaining)
      remaining -= toRemove
      totalRemoved += toRemove

      const nextAmount = currentAmount - toRemove

      vehicle.inventory = vehicle.inventory
        .map((entry) =>
          entry.item.id === item.id
            ? {
                ...entry,
                ...updateEntryDerivedValues(item, nextAmount),
              }
            : entry
        )
        .filter((entry) => (entry.amount || 0) > 0)

      updated[vehicleIndex] = { ...vehicle }
      lines.push(`${vehicle.name}: ${formatNumber(toRemove)}x verkauft`)
    }

    return { updatedVehicles: updated, remaining, totalRemoved, lines }
  }

  const handleTradeBuy = () => {
    if (!tradeSelectedItem || tradeVehicleIds.length === 0) {
      setTradeResultModal({
        title: "Ankauf fehlgeschlagen",
        message: "Bitte wähle ein Item und mindestens ein Fahrzeug aus.",
        variant: "warning",
      })
      return
    }

    const amount = Math.max(0, Math.floor(Number(tradeAmount) || 0))
    if (amount <= 0) {
      setTradeResultModal({
        title: "Ungültige Anzahl",
        message: "Bitte gib eine gültige Anzahl ein.",
        variant: "warning",
      })
      return
    }

    const result = processTradeBuy(vehicles, tradeSelectedItem, amount, tradeVehicleIds)
    setVehicles(result.updatedVehicles)

    setTradeResultModal({
      title: result.remaining > 0 ? "Ankauf teilweise eingelagert" : "Ankauf erfolgreich",
      message:
        result.remaining > 0
          ? `${formatNumber(result.totalAdded)}x ${tradeSelectedItem.name} eingelagert. Rest: ${formatNumber(result.remaining)}x`
          : `${formatNumber(result.totalAdded)}x ${tradeSelectedItem.name} erfolgreich eingelagert.`,
      lines: result.lines,
      variant: result.remaining > 0 ? "warning" : "success",
    })
  }

  const handleTradeSell = () => {
    if (!tradeSelectedItem || tradeVehicleIds.length === 0) {
      setTradeResultModal({
        title: "Verkauf fehlgeschlagen",
        message: "Bitte wähle ein Item und mindestens ein Fahrzeug aus.",
        variant: "warning",
      })
      return
    }

    const amount = Math.max(0, Math.floor(Number(tradeAmount) || 0))
    if (amount <= 0) {
      setTradeResultModal({
        title: "Ungültige Anzahl",
        message: "Bitte gib eine gültige Anzahl ein.",
        variant: "warning",
      })
      return
    }

    const result = processTradeSell(vehicles, tradeSelectedItem, amount, tradeVehicleIds)
    setVehicles(result.updatedVehicles)

    setTradeResultModal({
      title: result.remaining > 0 ? "Verkauf teilweise durchgeführt" : "Verkauf erfolgreich",
      message:
        result.remaining > 0
          ? `${formatNumber(result.totalRemoved)}x ${tradeSelectedItem.name} verkauft. Rest: ${formatNumber(result.remaining)}x`
          : `${formatNumber(result.totalRemoved)}x ${tradeSelectedItem.name} erfolgreich verkauft.`,
      lines: result.lines,
      variant: result.remaining > 0 ? "warning" : "success",
    })
  }

  const renderItemMeta = (entry: VehicleInventoryEntry) => {
    const parts: string[] = []

    if (entry.amount !== null && entry.amount !== undefined && entry.amount > 0) {
      parts.push(`${formatNumber(entry.amount)}x`)
    }

    if (entry.kg !== null && entry.kg !== undefined && entry.kg > 0) {
      parts.push(`${formatNumber(entry.kg)} KG`)
    }

    const stacks = getItemStacks(entry.item, entry.amount)
    if (stacks !== null) {
      parts.push(`${formatNumber(stacks)} Stacks`)
    }

    return parts.length > 0 ? parts.join(" · ") : null
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Übersicht" },
    { key: "storage", label: "Lager" },
    { key: "calculator", label: "Rechner" },
    { key: "prices", label: "Preise" },
    { key: "create", label: "Erstellen" },
    { key: "trade", label: "Ankauf/Verkauf" },
    { key: "dealers", label: "Dealer" },
  ]

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.10),transparent_16%),linear-gradient(to_bottom,#04050a,#070b14,#04050a)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-8 border-b border-white/10 pb-5 text-sm text-zinc-400">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`transition ${
                activeTab === tab.key
                  ? "border-b-2 border-emerald-400 pb-3 text-emerald-400"
                  : "hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={exportBackup}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Backup exportieren
          </button>

          <label className="cursor-pointer rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 transition hover:bg-blue-500/20">
            Backup importieren
            <input
              type="file"
              accept=".json,application/json"
              onChange={importBackup}
              className="hidden"
            />
          </label>
        </div>

        {activeTab === "overview" && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">Übersicht</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Alle Items aus allen Fahrzeugen zusammengefasst
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {overviewData.map((entry) => (
                <div
                  key={entry.item.id}
                  className="rounded-[1.6rem] border border-white/10 bg-[#061122] p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={entry.item.image}
                      alt={entry.item.name}
                      className="h-16 w-16 object-contain"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{entry.item.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {formatNumber(entry.totalAmount)}x · {formatNumber(entry.totalKg)} KG
                      </p>
                    </div>
                  </div>

                  {entry.dealerMode ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                        Niedrigster Preis
                        <br />
                        <span className="text-emerald-300">{formatMoney(entry.totalGreen)}</span>
                        <br />
                        <span className="text-orange-300">{formatMoney(entry.totalBlack)}</span>
                      </div>
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                        Höchster Preis
                        <br />
                        <span className="text-emerald-300">{formatMoney(entry.totalGreenMax)}</span>
                        <br />
                        <span className="text-red-300">{formatMoney(entry.totalBlackMax)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-black/25 p-3">
                        Schwarz
                        <br />
                        <span className="text-orange-400">{formatMoney(entry.totalBlack)}</span>
                      </div>
                      <div className="rounded-xl bg-black/25 p-3">
                        Grün
                        <br />
                        <span className="text-emerald-400">{formatMoney(entry.totalGreen)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {overviewData.length === 0 && (
                <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                  Noch keine Inventar-Daten vorhanden.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "storage" && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Lager</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Fahrzeuge, Inhalte und Tracking im Escocars / GVMP Style
                </p>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-zinc-400">{vehicles.length} Fahrzeuge</span>
              </div>
            </div>

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <input
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  placeholder="Suche nach Name, Kennzeichen, Notiz..."
                  className="w-full rounded-2xl border border-orange-500/40 bg-[#03101f] px-5 py-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-orange-400 focus:shadow-[0_0_0_1px_rgba(251,146,60,0.25)]"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((v) => {
                const currentKg = getVehicleCurrentKg(v)
                const usedSlots = getVehicleUsedSlots(v)

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#061122] transition duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                  >
                    <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditVehicle(v)
                        }}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteVehicle(v.id)
                        }}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Löschen
                      </button>
                    </div>

                    <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#13253d,#0b1a33)]">
                      <img
                        src={v.image}
                        alt={v.name}
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061122] via-transparent to-transparent" />
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[1.35rem] font-semibold leading-tight text-white">
                            {v.name}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-400">{v.plate || "n/a"}</p>
                        </div>

                        <span className="rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                          Lagerfahrzeug
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-zinc-300">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400">📍</span>
                          <span className="truncate">{v.location || "n/a"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-orange-400">📦</span>
                          <span>{v.inventory.length} Items</span>
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                          <span className="text-orange-400">⚖️</span>
                          <span className="text-zinc-400">
                            {v.maxKg && v.maxKg > 0
                              ? `${formatNumber(currentKg)} KG / ${formatNumber(v.maxKg)} KG`
                              : `${formatNumber(currentKg)} KG`}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                          <span className="text-orange-400">🧱</span>
                          <span className="text-zinc-400">
                            {v.maxSlots && v.maxSlots > 0
                              ? `${formatNumber(usedSlots)} / ${formatNumber(v.maxSlots)} Slots`
                              : `${formatNumber(usedSlots)} Slots`}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-start gap-2">
                          <span className="mt-[2px] text-orange-400">📝</span>
                          <span className="line-clamp-2 text-zinc-400">
                            {v.note || "Keine Notiz hinterlegt"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4">
                        <button className="text-sm text-orange-400 transition hover:text-orange-300">
                          Inventar öffnen
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredVehicles.length === 0 && (
                <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                  Keine Fahrzeuge gefunden.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "calculator" && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">Rechner</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Wertrechner für Items in Schwarz- und Grüngeld
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={calcItemId}
                onChange={(e) => setCalcItemId(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-500/40"
              >
                <option value="">Item auswählen</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                placeholder="Anzahl"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
              />

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-400">
                {calcSelectedItem ? calcSelectedItem.name : "Kein Item gewählt"}
              </div>
            </div>

            {calcResult && (
              <div className="mt-6 grid gap-4 md:grid-cols-5">
                <div className="rounded-xl bg-black/25 p-4">
                  Anzahl
                  <br />
                  <span className="text-orange-400">{formatNumber(calcResult.amount)}</span>
                </div>

                <div className="rounded-xl bg-black/25 p-4">
                  KG
                  <br />
                  <span className="text-purple-400">{formatNumber(calcResult.kg)}</span>
                </div>

                <div className="rounded-xl bg-black/25 p-4">
                  Stacks
                  <br />
                  <span className="text-blue-300">{formatNumber(calcResult.stacks)}</span>
                </div>

                {calcResult.dealerMode ? (
                  <>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      Niedrigster
                      <br />
                      <span className="text-emerald-300">{formatMoney(calcResult.green)}</span>
                      <br />
                      <span className="text-orange-300">{formatMoney(calcResult.black)}</span>
                    </div>

                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                      Höchster
                      <br />
                      <span className="text-emerald-300">{formatMoney(calcResult.greenMax)}</span>
                      <br />
                      <span className="text-red-300">{formatMoney(calcResult.blackMax)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-black/25 p-4">
                      Schwarz
                      <br />
                      <span className="text-orange-400">{formatMoney(calcResult.black)}</span>
                    </div>

                    <div className="rounded-xl bg-black/25 p-4">
                      Grün
                      <br />
                      <span className="text-emerald-400">{formatMoney(calcResult.green)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === "prices" && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">Preise</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Alle erstellten Items mit Preisübersicht
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const prices = getItemPrices(item)
                return (
                  <div
                    key={item.id}
                    className="rounded-[1.6rem] border border-white/10 bg-[#061122] p-5"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 object-contain"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-sm text-zinc-400">
                          {item.stackSize ? `${formatNumber(item.stackSize)} pro Stack` : "Kein Stack-Limit"}
                        </p>
                      </div>
                    </div>

                    {prices.dealerMode ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                          Niedrigster
                          <br />
                          <span className="text-emerald-300">{formatMoney(prices.dealerMinGreen)}</span>
                          <br />
                          <span className="text-orange-300">{formatMoney(prices.dealerMinBlack)}</span>
                        </div>
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                          Höchster
                          <br />
                          <span className="text-emerald-300">{formatMoney(prices.dealerMaxGreen)}</span>
                          <br />
                          <span className="text-red-300">{formatMoney(prices.dealerMaxBlack)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-black/25 p-3">
                          Schwarz
                          <br />
                          <span className="text-orange-400">{formatMoney(prices.black)}</span>
                        </div>
                        <div className="rounded-xl bg-black/25 p-3">
                          Grün
                          <br />
                          <span className="text-emerald-400">{formatMoney(prices.green)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {items.length === 0 && (
                <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                  Noch keine Items erstellt.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "trade" && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">Ankauf / Verkauf</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Items intelligent auf ausgewählte Fahrzeuge verteilen oder daraus verkaufen
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={tradeItemId}
                onChange={(e) => setTradeItemId(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-500/40"
              >
                <option value="">Item auswählen</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="Anzahl"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => {
                const currentKg = getVehicleCurrentKg(vehicle)
                const usedSlots = getVehicleUsedSlots(vehicle)
                const selected = tradeVehicleIds.includes(vehicle.id)
                const order = tradeVehicleIds.indexOf(vehicle.id) + 1 || null

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => toggleTradeVehicle(vehicle.id)}
                    className={`relative rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-orange-500/40"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400 bg-emerald-500/20 text-xs font-semibold text-emerald-300">
                        {order}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="h-14 w-14 object-contain"
                      />
                      <div>
                        <div className="font-medium text-white">{vehicle.name}</div>
                        <div className="text-sm text-zinc-400">{vehicle.plate}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-zinc-400">
                      {vehicle.note || "Keine Notiz"}
                    </div>

                    <div className="mt-2 text-xs text-zinc-500">
                      KG: {formatNumber(currentKg)}
                      {vehicle.maxKg ? ` / ${formatNumber(vehicle.maxKg)}` : ""}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Slots: {formatNumber(usedSlots)}
                      {vehicle.maxSlots ? ` / ${formatNumber(vehicle.maxSlots)}` : ""}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleTradeBuy}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 font-medium transition hover:scale-[1.01]"
              >
                Ankauf einlagern
              </button>

              <button
                onClick={handleTradeSell}
                className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 font-medium transition hover:scale-[1.01]"
              >
                Verkauf auslagern
              </button>
            </div>
          </section>
        )}

        {activeTab === "dealers" && (
          <section className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-[#08111f]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">Dealer erstellen</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  placeholder="Dealer Name"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />

                <input
                  value={dealerLocation}
                  onChange={(e) => setDealerLocation(e.target.value)}
                  placeholder="Standort"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />

                <select
                  value={dealerStage}
                  onChange={(e) => setDealerStage(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                >
                  <option value={1}>Stage 1 - niedriges Risiko</option>
                  <option value={2}>Stage 2</option>
                  <option value={3}>Stage 3</option>
                  <option value={4}>Stage 4 - höchstes Risiko</option>
                </select>

                <input
                  type="number"
                  min={0}
                  value={dealerCratePriceBlack}
                  onChange={(e) => setDealerCratePriceBlack(e.target.value)}
                  placeholder="Kisten Preis Schwarz"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />

                <input
                  id="dealerFileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDealerImageUpload(e, "create")}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-3 file:py-2 file:text-white md:col-span-2"
                />

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={dealerIsActive}
                    onChange={(e) => setDealerIsActive(e.target.checked)}
                  />
                  <span>Dealer direkt aktiv schalten</span>
                </label>
              </div>

              <div className="mt-5">
  <div className="mb-3 text-sm text-zinc-400">
    Zusätzliche ankaufbare Items (Kisten sind immer standardmäßig aktiv)
  </div>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {items
      .filter((item) => !isCrateItemName(item.name))
      .map((item) => {
        const selected = dealerExtraItems.some((entry) => entry.itemId === item.id)
        const currentEntry = dealerExtraItems.find((entry) => entry.itemId === item.id)

        return (
          <div
            key={item.id}
            className={`rounded-xl border px-3 py-3 transition ${
              selected
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <button
              onClick={() =>
                selected
                  ? openDealerItemPriceModal("create", item.id, currentEntry?.priceBlack)
                  : openDealerItemPriceModal("create", item.id)
              }
              className="w-full text-left"
            >
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-10 w-10 object-contain" />
                <div>
                  <div className="text-sm">{item.name}</div>
                  <div className="text-xs text-zinc-400">
                    {selected ? `Preis: ${formatMoney(currentEntry?.priceBlack)}` : "Nicht aktiv"}
                  </div>
                </div>
              </div>
            </button>

            {selected && (
              <button
                onClick={() => removeDealerExtraItem("create", item.id)}
                className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
              >
                Entfernen
              </button>
            )}
          </div>
        )
      })}
  </div>
</div>

              <button
                onClick={createDealer}
                className="mt-5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 font-medium transition hover:scale-[1.01]"
              >
                Dealer erstellen
              </button>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#071121]/95 to-[#050914]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Aktive Dealer</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Nur aktive Dealer werden hier angezeigt
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {activeDealers.map((dealer) => (
                  <div
                    key={dealer.id}
                    onClick={() => setDealerCalcModal({ dealerId: dealer.id, amount: "1" })}
                    className="group relative cursor-pointer overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#061122] transition duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                  >
                    <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditDealer(dealer)
                        }}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDealer(dealer.id)
                        }}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Löschen
                      </button>
                    </div>

                    <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#2a1313,#1a0b0b)]">
                      <img
                        src={dealer.image}
                        alt={dealer.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061122] via-transparent to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-[1.35rem] font-semibold text-white">{dealer.name}</h3>
                      <div className="mt-3 space-y-2 text-sm text-zinc-300">
                        <div>Standort: <span className="text-zinc-400">{dealer.location}</span></div>
                        <div>Kisten Schwarz: <span className="text-orange-400">{formatMoney(dealer.cratePriceBlack)}</span></div>
                        <div>Grün: <span className="text-emerald-400">{formatMoney(dealer.cratePriceBlack * 0.8)}</span></div>
                        <div>
                          Stage:{" "}
                          <span
                            className={`${
                              dealer.stage === 1
                                ? "text-emerald-300"
                                : dealer.stage === 2
                                ? "text-yellow-300"
                                : dealer.stage === 3
                                ? "text-orange-300"
                                : "text-red-300"
                            }`}
                          >
                            {dealer.stage}
                          </span>
                        </div>
                        <div>
  Ankauf:{" "}
  <span className="text-zinc-400">
    Kisten
    {dealer.extraItems.length > 0
      ? `, ${dealer.extraItems
          .map((entry) => items.find((item) => item.id === entry.itemId)?.name)
          .filter(Boolean)
          .join(", ")}`
      : ""}
  </span>
</div>
                      </div>
                    </div>
                  </div>
                ))}

                {activeDealers.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                    Keine aktiven Dealer vorhanden.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#08111f]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">Gespeicherte Dealer Verwaltung</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dealers.map((dealer) => (
                  <div key={dealer.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <img src={dealer.image} alt={dealer.name} className="h-14 w-14 object-cover rounded-xl" />
                      <div>
                        <div className="font-semibold">{dealer.name}</div>
                        <div className="text-sm text-zinc-400">{dealer.location}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-zinc-400">
                      Status: {dealer.isActive ? <span className="text-emerald-300">Aktiv</span> : <span className="text-zinc-500">Inaktiv</span>}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEditDealer(dealer)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() =>
                          setDealers((prev) =>
                            prev.map((d) =>
                              d.id === dealer.id ? { ...d, isActive: !d.isActive } : d
                            )
                          )
                        }
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                      >
                        {dealer.isActive ? "Deaktivieren" : "Aktivieren"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeTab === "create" && (
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-[#08111f]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">Item erstellen</h2>

              <div className="grid gap-4">
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Item Name"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <input
                  id="itemFileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleItemImageUpload(e, "create")}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-500 file:px-3 file:py-2 file:text-white"
                />

                <input
                  type="number"
                  min={0}
                  value={itemDefaultAmount}
                  onChange={(e) => setItemDefaultAmount(e.target.value)}
                  placeholder="Optional: Standard Anzahl"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={itemDefaultKg}
                  onChange={(e) => setItemDefaultKg(e.target.value)}
                  placeholder="Optional: Standard KG"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <input
                  type="number"
                  min={0}
                  value={itemStackSize}
                  onChange={(e) => setItemStackSize(e.target.value)}
                  placeholder="Optional: Stack Limit"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <input
                  type="number"
                  min={0}
                  value={itemPriceBlack}
                  onChange={(e) => setItemPriceBlack(e.target.value)}
                  placeholder="Optional: Schwarzpreis"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <input
                  type="number"
                  min={0}
                  value={itemPriceGreen}
                  onChange={(e) => setItemPriceGreen(e.target.value)}
                  placeholder="Optional: Grünpreis"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
                />

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={itemUseDealerPricing}
                    onChange={(e) => setItemUseDealerPricing(e.target.checked)}
                  />
                  <span>Dealer Preis verwenden</span>
                </label>

                <button
                  onClick={createItem}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 font-medium transition hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]"
                >
                  Item erstellen
                </button>
              </div>

              {items.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 text-sm text-zinc-400">Vorhandene Items</div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-purple-500/40 hover:bg-white/[0.05]"
                      >
                        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => startEditItem(item)}
                            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] text-blue-300 hover:bg-blue-500/20"
                          >
                            E
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20"
                          >
                            X
                          </button>
                        </div>

                        <button onClick={() => openAssignModal(item)} className="w-full">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="mx-auto h-16 w-16 object-contain transition duration-300 group-hover:scale-105"
                          />
                          <div className="mt-2 truncate text-xs text-zinc-300">{item.name}</div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-[#08111f]/90 p-6">
              <h2 className="mb-5 text-xl font-semibold">Fahrzeug erstellen</h2>

              <div className="grid gap-4">
                <input
                  value={vehName}
                  onChange={(e) => setVehName(e.target.value)}
                  placeholder="Name"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <input
                  id="vehFileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVehicleImageUpload(e, "create")}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-white"
                />

                <input
                  value={vehPlate}
                  onChange={(e) => setVehPlate(e.target.value)}
                  placeholder="Kennzeichen"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <input
                  value={vehLocation}
                  onChange={(e) => setVehLocation(e.target.value)}
                  placeholder="Standort"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <input
                  value={vehNote}
                  onChange={(e) => setVehNote(e.target.value)}
                  placeholder="Notiz"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={vehMaxKg}
                  onChange={(e) => setVehMaxKg(e.target.value)}
                  placeholder="Optional: Max KG"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <input
                  type="number"
                  min={0}
                  value={vehMaxSlots}
                  onChange={(e) => setVehMaxSlots(e.target.value)}
                  placeholder="Optional: Max Slots"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-orange-500/40"
                />

                <button
                  onClick={createVehicle}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 font-medium transition hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(249,115,22,0.25)]"
                >
                  Fahrzeug erstellen
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-orange-400">
                  Fahrzeug Inventar
                </div>
                <h2 className="mt-2 text-3xl font-semibold">{selectedVehicle.name}</h2>
                <div className="mt-2 text-sm text-zinc-400">
                  {selectedVehicle.plate || "n/a"} · {selectedVehicle.location || "n/a"}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {selectedVehicle.note || "Keine Notiz vorhanden"}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  Aktuell: {formatNumber(getVehicleCurrentKg(selectedVehicle))} KG
                  {selectedVehicle.maxKg && selectedVehicle.maxKg > 0
                    ? ` / ${formatNumber(selectedVehicle.maxKg)} KG`
                    : ""}
                  {" · "}
                  {formatNumber(getVehicleUsedSlots(selectedVehicle))} Slots
                  {selectedVehicle.maxSlots && selectedVehicle.maxSlots > 0
                    ? ` / ${formatNumber(selectedVehicle.maxSlots)} Slots`
                    : ""}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => clearVehicleInventory(selectedVehicle.id)}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm transition hover:bg-red-500/20"
                >
                  Inv Clear
                </button>
                <button
                  onClick={() => setSelectedVehicleId(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  Schließen
                </button>
              </div>
            </div>

            {selectedVehicle.inventory.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {selectedVehicle.inventory.map((entry, idx) => {
                  const values = getEntryValues(entry)
                  const stacks = getItemStacks(entry.item, entry.amount)

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:border-orange-500/35"
                    >
                      <img
                        src={entry.item.image}
                        alt={entry.item.name}
                        className="mx-auto h-20 w-20 object-contain"
                      />

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() =>
                              changeInventoryAmount(selectedVehicle.id, entry.item.id, -1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg transition hover:border-red-500/40 hover:text-red-400"
                          >
                            -
                          </button>

                          <span className="min-w-[32px] text-sm font-semibold text-orange-400">
                            {formatNumber(entry.amount)}x
                          </span>

                          <button
                            onClick={() =>
                              changeInventoryAmount(selectedVehicle.id, entry.item.id, 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg transition hover:border-emerald-500/40 hover:text-emerald-400"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-xs text-zinc-400">
                          KG: <span className="text-purple-400">{formatNumber(entry.kg)}</span>
                        </div>

                        <div className="text-xs text-zinc-400">
                          Stacks: <span className="text-blue-300">{formatNumber(stacks)}</span>
                        </div>

                        {values.dealerMode ? (
                          <>
                            <div className="text-xs text-zinc-400">
                              Min Preis: <span className="text-emerald-300">{formatMoney(values.green)}</span> / <span className="text-orange-300">{formatMoney(values.black)}</span>
                            </div>
                            <div className="text-xs text-zinc-400">
                              Max Preis: <span className="text-emerald-300">{formatMoney(values.maxGreen)}</span> / <span className="text-red-300">{formatMoney(values.maxBlack)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-zinc-400">
                              Schwarz: <span className="text-orange-400">{formatMoney(values.black)}</span>
                            </div>

                            <div className="text-xs text-zinc-400">
                              Grün: <span className="text-emerald-400">{formatMoney(values.green)}</span>
                            </div>
                          </>
                        )}

                        <div className="text-xs text-zinc-500">{renderItemMeta(entry)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
                Dieses Fahrzeug ist aktuell leer.
              </div>
            )}
          </div>
        </div>
      )}

      {showAssignModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex items-center gap-4">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="h-16 w-16 object-contain"
              />
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-purple-400">
                  Item zuweisen
                </div>
                <h2 className="mt-1 text-2xl font-semibold">{selectedItem.name}</h2>
              </div>
            </div>

            <div className="grid gap-4">
              <select
                value={assignVehicleId}
                onChange={(e) => setAssignVehicleId(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1320] px-4 py-3 text-white outline-none transition focus:border-purple-500/40"
              >
                <option value="">Fahrzeug wählen</option>
                {vehicles.map((v) => {
                  const currentKg = getVehicleCurrentKg(v)
                  const usedSlots = getVehicleUsedSlots(v)

                  return (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plate || "n/a"}) - {v.note || "Keine Notiz"} -{" "}
                      {v.maxKg && v.maxKg > 0
                        ? `${formatNumber(currentKg)}/${formatNumber(v.maxKg)} KG`
                        : `${formatNumber(currentKg)} KG`}
                      {" - "}
                      {v.maxSlots && v.maxSlots > 0
                        ? `${formatNumber(usedSlots)}/${formatNumber(v.maxSlots)} Slots`
                        : `${formatNumber(usedSlots)} Slots`}
                    </option>
                  )
                })}
              </select>

              <input
                type="number"
                min={0}
                value={assignAmount}
                onChange={(e) => setAssignAmount(e.target.value)}
                placeholder="Anzahl"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-purple-500/40"
              />

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                Automatische KG:{" "}
                <span className="text-purple-400">
                  {selectedItem && getConversionRatio(selectedItem) !== null
                    ? formatNumber(getComputedAssignKg())
                    : "-"}
                </span>
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  onClick={assignItemToVehicle}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-medium transition hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]"
                >
                  Zuweisen
                </button>

                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedItem(null)
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-white/10"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dealerCalcModal && (() => {
        const dealer = dealers.find((d) => d.id === dealerCalcModal.dealerId)
        if (!dealer) return null

        const amount = Math.max(0, Number(dealerCalcModal.amount) || 0)
        const black = dealer.cratePriceBlack * amount
        const green = black * 0.8

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
            <div className="animate-scale w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={dealer.image}
                  alt={dealer.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-red-400">
                    Dealer Berechnung
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold">{dealer.name}</h2>
                  <div className="mt-1 text-sm text-zinc-400">{dealer.location}</div>
                </div>
              </div>

              <div className="grid gap-4">
                <input
                  type="number"
                  min={0}
                  value={dealerCalcModal.amount}
                  onChange={(e) =>
                    setDealerCalcModal((prev) =>
                      prev ? { ...prev, amount: e.target.value } : null
                    )
                  }
                  placeholder="Anzahl Kisten"
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    Schwarz
                    <br />
                    <span className="text-red-300">{formatMoney(black)}</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    Grün
                    <br />
                    <span className="text-emerald-300">{formatMoney(green)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDealerCalcModal(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-white/10"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {editItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6">
            <h2 className="mb-5 text-2xl font-semibold">Item bearbeiten</h2>
            <div className="grid gap-4">
              <input
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                placeholder="Name"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleItemImageUpload(e, "edit")}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-500 file:px-3 file:py-2 file:text-white"
              />

              <input
                value={editItemDefaultAmount}
                onChange={(e) => setEditItemDefaultAmount(e.target.value)}
                placeholder="Standard Anzahl"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editItemDefaultKg}
                onChange={(e) => setEditItemDefaultKg(e.target.value)}
                placeholder="Standard KG"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editItemStackSize}
                onChange={(e) => setEditItemStackSize(e.target.value)}
                placeholder="Stack Limit"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editItemPriceBlack}
                onChange={(e) => setEditItemPriceBlack(e.target.value)}
                placeholder="Schwarzpreis"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editItemPriceGreen}
                onChange={(e) => setEditItemPriceGreen(e.target.value)}
                placeholder="Grünpreis"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <input
                  type="checkbox"
                  checked={editItemUseDealerPricing}
                  onChange={(e) => setEditItemUseDealerPricing(e.target.checked)}
                />
                <span>Dealer Preis verwenden</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveEditItem}
                className="rounded-xl bg-blue-500 px-5 py-3"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditItemId(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {editVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6">
            <h2 className="mb-5 text-2xl font-semibold">Fahrzeug bearbeiten</h2>
            <div className="grid gap-4">
              <input
                value={editVehName}
                onChange={(e) => setEditVehName(e.target.value)}
                placeholder="Name"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleVehicleImageUpload(e, "edit")}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-white"
              />

              <input
                value={editVehPlate}
                onChange={(e) => setEditVehPlate(e.target.value)}
                placeholder="Kennzeichen"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editVehLocation}
                onChange={(e) => setEditVehLocation(e.target.value)}
                placeholder="Standort"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editVehNote}
                onChange={(e) => setEditVehNote(e.target.value)}
                placeholder="Notiz"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editVehMaxKg}
                onChange={(e) => setEditVehMaxKg(e.target.value)}
                placeholder="Max KG"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editVehMaxSlots}
                onChange={(e) => setEditVehMaxSlots(e.target.value)}
                placeholder="Max Slots"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveEditVehicle}
                className="rounded-xl bg-blue-500 px-5 py-3"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditVehicleId(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {editDealerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6">
            <h2 className="mb-5 text-2xl font-semibold">Dealer bearbeiten</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={editDealerName}
                onChange={(e) => setEditDealerName(e.target.value)}
                placeholder="Dealer Name"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                value={editDealerLocation}
                onChange={(e) => setEditDealerLocation(e.target.value)}
                placeholder="Standort"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <select
                value={editDealerStage}
                onChange={(e) => setEditDealerStage(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
              >
                <option value={1}>Stage 1</option>
                <option value={2}>Stage 2</option>
                <option value={3}>Stage 3</option>
                <option value={4}>Stage 4</option>
              </select>

              <input
                value={editDealerCratePriceBlack}
                onChange={(e) => setEditDealerCratePriceBlack(e.target.value)}
                placeholder="Kisten Preis Schwarz"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleDealerImageUpload(e, "edit")}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-3 file:py-2 file:text-white md:col-span-2"
              />

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={editDealerIsActive}
                  onChange={(e) => setEditDealerIsActive(e.target.checked)}
                />
                <span>Dealer aktiv</span>
              </label>
            </div>

            <div className="mt-5">
  <div className="mb-3 text-sm text-zinc-400">
    Zusätzliche ankaufbare Items (Kisten sind automatisch aktiv)
  </div>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {items
      .filter((item) => !isCrateItemName(item.name))
      .map((item) => {
        const selected = editDealerExtraItems.some((entry) => entry.itemId === item.id)
        const currentEntry = editDealerExtraItems.find((entry) => entry.itemId === item.id)

        return (
          <div
            key={item.id}
            className={`rounded-xl border px-3 py-3 transition ${
              selected
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <button
              onClick={() =>
                selected
                  ? openDealerItemPriceModal("edit", item.id, currentEntry?.priceBlack)
                  : openDealerItemPriceModal("edit", item.id)
              }
              className="w-full text-left"
            >
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-10 w-10 object-contain" />
                <div>
                  <div className="text-sm">{item.name}</div>
                  <div className="text-xs text-zinc-400">
                    {selected ? `Preis: ${formatMoney(currentEntry?.priceBlack)}` : "Nicht aktiv"}
                  </div>
                </div>
              </div>
            </button>

            {selected && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openDealerItemPriceModal("edit", item.id, currentEntry?.priceBlack)}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300"
                >
                  Preis ändern
                </button>
                <button
                  onClick={() => removeDealerExtraItem("edit", item.id)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        )
      })}
  </div>
</div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={saveEditDealer}
                className="rounded-xl bg-blue-500 px-5 py-3"
              >
                Speichern
              </button>
              <button
                onClick={() => setEditDealerId(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {tradeResultModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 animate-fade">
          <div className="animate-scale w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4">
              <div
                className={`text-sm uppercase tracking-[0.25em] ${
                  tradeResultModal.variant === "success"
                    ? "text-emerald-400"
                    : tradeResultModal.variant === "warning"
                    ? "text-orange-400"
                    : tradeResultModal.variant === "error"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                Transaktionsmeldung
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{tradeResultModal.title}</h2>
              <p className="mt-3 text-zinc-300">{tradeResultModal.message}</p>
            </div>

            {tradeResultModal.lines && tradeResultModal.lines.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="space-y-2 text-sm text-zinc-300">
                  {tradeResultModal.lines.map((line, index) => (
                    <div
                      key={`${line}-${index}`}
                      className="rounded-xl border border-white/5 bg-black/20 px-3 py-2"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTradeResultModal(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-white/10"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}


{dealerItemPriceModal && (() => {
  const sourceItems = dealerItemPriceModal.mode === "create" ? dealerExtraItems : editDealerExtraItems
  const item = items.find((i) => i.id === dealerItemPriceModal.itemId)
  if (!item) return null

  const currentEntry = sourceItems.find((entry) => entry.itemId === item.id)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 animate-fade">
      <div className="animate-scale w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-center gap-4">
          <img
            src={item.image}
            alt={item.name}
            className="h-16 w-16 object-contain"
          />
          <div>
            <div className="text-sm uppercase tracking-[0.25em] text-red-400">
              Dealer Item Preis
            </div>
            <h2 className="mt-1 text-2xl font-semibold">{item.name}</h2>
            <div className="mt-1 text-sm text-zinc-400">
              Preis für diesen Dealer festlegen
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <input
            type="number"
            min={0}
            value={dealerItemPriceModal.price}
            onChange={(e) =>
              setDealerItemPriceModal((prev) =>
                prev ? { ...prev, price: e.target.value } : null
              )
            }
            placeholder="Schwarzpreis"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
          />

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
            Grünpreis:{" "}
            <span className="text-emerald-300">
              {dealerItemPriceModal.price
                ? formatMoney((Math.max(0, Number(dealerItemPriceModal.price) || 0)) * 0.8)
                : "-"}
            </span>
          </div>

          {currentEntry && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-zinc-300">
              Aktueller Preis: <span className="text-orange-300">{formatMoney(currentEntry.priceBlack)}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={saveDealerItemPrice}
            className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-3 font-medium transition hover:scale-[1.01]"
          >
            Speichern
          </button>

          <button
            onClick={() => setDealerItemPriceModal(null)}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-white/10"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
})()}


      <style jsx global>{`
        .animate-fade {
          animation: fadeIn 0.18s ease;
        }

        .animate-scale {
          animation: scaleIn 0.22s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}