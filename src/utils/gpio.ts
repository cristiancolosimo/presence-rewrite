import fs from 'fs';
import { exec } from 'child_process';
import { sleep } from '../utils/utils_function';
export function readPin(pin: number) {
    const value = parseInt(fs.readFileSync(`/sys/class/gpio/gpio${pin}/value`, {encoding:'utf8'})) 
    return value;
}

export function exportReadPin(pin:number){
    exec(`echo ${pin} > /sys/class/gpio/export`);
    exec(`echo in > /sys/class/gpio/gpio${pin}/direction`);
}
export function exportWritePin(pin:number){
    exec(`echo ${pin} > /sys/class/gpio/export`);
    exec(`echo out > /sys/class/gpio/gpio${pin}/direction`);
}

export async function sendPulse(pin:number,duration:number){
    exec(`echo ${0} > /sys/class/gpio/gpio${pin}/value`);
    await sleep(duration);
    exec(`echo ${1} > /sys/class/gpio/gpio${pin}/value`);
}