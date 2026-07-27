export interface ShipmentTask {
  OI?: string;
  Date: string;
  Type: string;
  Express: string;
  MBL: string;
  HBL: string;
  ContainerNu: string;
  Fee: string;
  ETA: string;
  POL: string;
  POD: string;
  FinalDes: string;
  FclTrk: string;
  DODate: string;
  Terminal: string;
  TrainSta: string;
  Destination: string;
  Vessel: string;
  Voyage: string;
  Remarks: string;
  Description: string;
  Marks: string;
  Sale: string;
}

export interface ITaskDataSource {
  getTasks(filePath: string): Promise<ShipmentTask[]>;
}
