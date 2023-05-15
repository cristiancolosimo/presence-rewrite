// or
import { SerialPort } from "serialport";
//costanti
const MSG_OK = "OK\r\n";
const MSG_RING = "\r\nRING\r\n";
const MSG_BUSY = "BUSY\r\n";
const MSG_OPEN = "atdt*\r";

const INIT_COMMANDS = [
  "at\r",
  "atz\r",
  "at*nc9\r",
  "atx3\r",
  "ats11=60\r",
  "ats0=0\r",
];

type STANDARD_BAUDRATE = 9600 | 19200 | 38400 | 57600 | 115200;
class HpccExternal {
  port: SerialPort;
  constructor(device: string, baudRate: STANDARD_BAUDRATE) {
    this.port = new SerialPort({
      path: device,
      baudRate: baudRate,
      autoOpen: false,
    });
  }
  private async sendCommand(command: string) {
    return new Promise<void>((resolve, reject) => {
      this.port.write(command, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  private async readResponse() {
    return new Promise<string>((resolve, reject) => {
      this.port.once("data", (data) => {
        resolve(data.toString());
      });
    });
  }

  private async open() {
    return new Promise<void>((resolve, reject) => {
      this.port.open((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  private async close() {
    return new Promise<void>((resolve, reject) => {
      this.port.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
