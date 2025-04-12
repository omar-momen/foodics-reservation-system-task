export interface Table {
  id: string
  name: string
  accepts_reservations: boolean
}

export interface Section {
  id: string
  name: string
  tables: Table[]
}

export interface ReservationTimes {
  [key: string]: [string, string][]
}

export interface Branch {
  id: string
  name: string
  reference: string
  accepts_reservations: boolean
  reservation_duration: number
  reservation_times: ReservationTimes
  sections: Section[]
}

export interface BranchesResponse {
  data: Branch[]
}
