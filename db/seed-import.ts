import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const positions = [
  { id: 1, name: "WORKSHOP OPERATOR" },
  { id: 2, name: "WIREMAN" },
  { id: 3, name: "APPRENTICE WIREMAN" },
  { id: 4, name: "TRAINEE WIREMAN" },
  { id: 5, name: "ENGINE ROOM OPERATOR" },
  { id: 6, name: "GARDENER" },
  { id: 7, name: "KCP OPERATOR" },
  { id: 8, name: "OPERATOR EFFLUENT POND" },
  { id: 9, name: "MILL COMPOUND OPERATOR" },
  { id: 10, name: "GENERAL WORKERS" },
  { id: 11, name: "LOADING RAMP OPR" },
  { id: 12, name: "TUKANG SAPU" },
  { id: 13, name: "FFB GRADING" },
  { id: 14, name: "TRAINEE MANDORE" },
  { id: 15, name: "TRAINEE OPERATOR" },
  { id: 16, name: "TRANSFER L.RAMP" },
  { id: 17, name: "THRESHER DRUM OPR" },
  { id: 18, name: "STERILIZER OPR" },
  { id: 19, name: "TIPPLER OPR" },
  { id: 20, name: "CAPSTAND OPR" },
  { id: 21, name: "KERNEL PLANT OPR" },
  { id: 22, name: "PRESS OPR" },
  { id: 23, name: "OIL ROOM OPR" },
  { id: 24, name: "BOILERMAN" },
  { id: 25, name: "EFB PRESS OPR" },
  { id: 26, name: "EMPTY BUNCH HOPPER" },
  { id: 27, name: "TRANSFER CAPSTAND" },
  { id: 28, name: "SECURITY" },
  { id: 29, name: "ASST PAYROLL CLERK" },
  { id: 30, name: "PAYROLL CLERK" },
  { id: 31, name: "ASST PURCHASING CLERK" },
  { id: 32, name: "ASST SD CLERK" },
  { id: 33, name: "WEIGHBRIDGE" },
  { id: 34, name: "STORE KEEPER" },
  { id: 35, name: "OFFICE CLEANER" },
  { id: 36, name: "OPERATOR WATER TREATMENT" },
  { id: 37, name: "LAB DEPARTMENT" },
  { id: 38, name: "HOUSE MAID" },
  { id: 39, name: "SHOVEL DRIVER" },
  { id: 40, name: "MECHANICS AUTOMOBILE" },
  { id: 41, name: "TRAINEE MAINTENANCE ENGINEER" },
  { id: 42, name: "TRAINEE PRODUCTION ENGINEER" },
  { id: 43, name: "AUTOMOBILE MECHANIC" },
  { id: 44, name: "CHIEF GRADER" },
  { id: 45, name: "MILL SUPERVISOR" },
  { id: 46, name: "SHIFT SUPERVISOR (A)" },
  { id: 47, name: "BOILER INCHARGEMAN" },
  { id: 48, name: "FOREMAN" },
  { id: 49, name: "PURCHASING CLERK" },
  { id: 50, name: "SD CLERK" },
  { id: 51, name: "TRAINING MANDORE SHIFT B" },
  { id: 52, name: "SHIFT SUPERVISOR B" },
  { id: 53, name: "MANDORE SHIFT A" },
  { id: 54, name: "ASSISTANT FOREMAN" },
];

const stations = [
  { id: 1, name: "WORKSHOP" },
  { id: 2, name: "ENGINE ROOM" },
  { id: 3, name: "MILL FARMER" },
  { id: 4, name: "PRODUCTION" },
  { id: 5, name: "EFFLUENT POND" },
  { id: 6, name: "MILL COMPOUND" },
  { id: 7, name: "MILL CLEANER" },
  { id: 8, name: "FFB GRADE AREA" },
  { id: 9, name: "BOILER HOUSE" },
  { id: 10, name: "SAFETY GUARD" },
  { id: 11, name: "OFFICE" },
  { id: 12, name: "STORE" },
  { id: 13, name: "WATER TREATMENT" },
  { id: 14, name: "LAB DEPARTMENT" },
  { id: 15, name: "MANAGER'S HOUSE" },
  { id: 16, name: "GRADING & BOILER HOUSE" },
];

type Row = {
  n: string;
  t: "STAFF" | "CLERK";
  ic: string | null;
  al: number;
  mc: number;
  bs: number | null;
  hr: number;
  bt: "NORMAL" | "TWO_HOUR";
  no: "t" | "f";
  rd: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  p: number;
  s: number;
};

const employeesData: Row[] = [
  { n: "SAFPIKAH BINTI JASMI", t: "STAFF", ic: "010329121158", al: 12, mc: 14, bs: 1850, hr: 8.89, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 50, s: 11 },
  { n: "DZAIRUDDIN BIN AMBIKIN", t: "CLERK", ic: null, al: 8, mc: 12, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 28, s: 10 },
  { n: "MUH FADLI NUR", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "IVVAN KEVIN JR NUEH", t: "STAFF", ic: "930322126257", al: 8, mc: 14, bs: 2400, hr: 11.54, bt: "TWO_HOUR", no: "f", rd: "SUNDAY", p: 42, s: 4 },
  { n: "EMPIN SAAT", t: "STAFF", ic: "940317127633", al: 11, mc: 22, bs: 2000, hr: 9.62, bt: "NORMAL", no: "f", rd: "MONDAY", p: 45, s: 4 },
  { n: "CERLENSH BINTI JULIE", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.41, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 31, s: 11 },
  { n: "NINA SYAHRINA CHEW", t: "CLERK", ic: null, al: 1, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 30, s: 11 },
  { n: "AZRUIZHEN SEVERINUS", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.41, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 32, s: 11 },
  { n: "JULISIP BASIR", t: "STAFF", ic: "670729125127", al: 10, mc: 18, bs: 2000, hr: 9.62, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 44, s: 8 },
  { n: "BRAYEN ERICK NORBERT", t: "STAFF", ic: "930802126379", al: 2, mc: 16, bs: 2300, hr: 11.06, bt: "TWO_HOUR", no: "f", rd: "SUNDAY", p: 41, s: 1 },
  { n: "MEJIE BUDING", t: "STAFF", ic: "990629126643", al: 15, mc: 22, bs: 1850, hr: 8.89, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 49, s: 11 },
  { n: "ALWIN YESSOPPU", t: "CLERK", ic: null, al: 7, mc: 11, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "FORNTRESYA NAITING", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 29, s: 11 },
  { n: "ALFONSIUS", t: "CLERK", ic: null, al: 15, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "RAYMOND", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "MOHD AZRIN BIN AWANG", t: "STAFF", ic: "910721125069", al: 14, mc: 14, bs: 3200, hr: 15.38, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 47, s: 9 },
  { n: "BINHAR TAKKA", t: "CLERK", ic: null, al: 6, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "RAMLAN BIN ENGGAN", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "TALIB BIN KADIR", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 24, s: 9 },
  { n: "SIMON PINSIL", t: "STAFF", ic: "811016125641", al: 6, mc: 14, bs: 2244, hr: 10.79, bt: "NORMAL", no: "f", rd: "THURSDAY", p: 40, s: 1 },
  { n: "JUNAIDI BIN MANSYUR", t: "CLERK", ic: null, al: 15, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 36, s: 13 },
  { n: "FEKY ATAUPAH", t: "CLERK", ic: null, al: 12, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 36, s: 13 },
  { n: "RAYON ERIRINO SAWE", t: "CLERK", ic: null, al: 12, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 36, s: 13 },
  { n: "ALFREDO ARNOCO SEDENIO", t: "STAFF", ic: "P2301289A", al: 16, mc: 22, bs: 2768, hr: 13.31, bt: "NORMAL", no: "f", rd: "THURSDAY", p: 48, s: 1 },
  { n: "ROEL PUAQUE NOCOS", t: "CLERK", ic: null, al: 13, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 5, s: 2 },
  { n: "LUKMAN AMIR", t: "STAFF", ic: "C8034404", al: 8, mc: 18, bs: 1850, hr: 8.89, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 51, s: 4 },
  { n: "TANDY ENISAP", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 5, s: 2 },
  { n: "MARTHEN LONDONG", t: "STAFF", ic: "C8034428", al: 15, mc: 21, bs: 1850, hr: 8.89, bt: "NORMAL", no: "f", rd: "WEDNESDAY", p: 53, s: 4 },
  { n: "BUDING BIN RUSIP", t: "CLERK", ic: null, al: 14, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 5, s: 2 },
  { n: "RUSTAM KASSIM", t: "STAFF", ic: "E5282159", al: 12, mc: 22, bs: 2000, hr: 9.62, bt: "NORMAL", no: "f", rd: "TUESDAY", p: 46, s: 4 },
  { n: "KAMIS YAMBO", t: "STAFF", ic: null, al: 6, mc: 22, bs: 2000, hr: 9.62, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 52, s: 4 },
  { n: "SABUDY PELEN", t: "CLERK", ic: null, al: 11, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 28, s: 10 },
  { n: "HARUAN BIN TUNING", t: "CLERK", ic: null, al: 5, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 28, s: 10 },
  { n: "ROGELITO AURE", t: "STAFF", ic: null, al: 14, mc: 14, bs: 2200, hr: 10.58, bt: "NORMAL", no: "t", rd: "SUNDAY", p: 54, s: 1 },
  { n: "ALFORENCE ANSULOP", t: "CLERK", ic: null, al: 6, mc: 10, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 28, s: 10 },
  { n: "MOHD JAZMIE HAIRIE", t: "CLERK", ic: null, al: 1, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 28, s: 10 },
  { n: "FRYWELSON FARON FRANCIS", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "DONALD JAEM", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "FRANSISKO ZEAMAN MANGU", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "ARDIANUS CAL VAROTTA SAWE MARANG", t: "CLERK", ic: null, al: 8, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "JEFONY JUBILI", t: "CLERK", ic: null, al: 7, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "MOHD AFIS BIN GUDANG", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "JULFIKAR BIN SAHIBAD", t: "CLERK", ic: null, al: 3, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "JASMIN BIN ZAINAL", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 8 },
  { n: "BERNADUS PATI PUATUDEQ", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 39, s: 8 },
  { n: "HAIKAL HAMAD", t: "CLERK", ic: null, al: 11, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 39, s: 8 },
  { n: "SUL SOPPAH", t: "CLERK", ic: null, al: 6, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 39, s: 8 },
  { n: "VINSENSIUS SUBANG", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 39, s: 8 },
  { n: "OLIVER OWENCLAY CLARENCE", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 40, s: 1 },
  { n: "AMELIA LIPAT", t: "CLERK", ic: null, al: 12, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "ROMEDDY RASAH", t: "CLERK", ic: null, al: 9, mc: 21, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "RISWANDY BIN RAHMAN", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "MOHD EKHRAM BIN ABDUL RAHIM", t: "CLERK", ic: null, al: 7, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "MASDI MARSELINUS", t: "CLERK", ic: null, al: 16, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "RISKI MARAN", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 6, s: 3 },
  { n: "DOMINIKUS LEDO", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 6, s: 3 },
  { n: "ANDRI WIJAYA", t: "CLERK", ic: null, al: 4, mc: 13, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 6, s: 3 },
  { n: "JAMARIN BIN UBI", t: "CLERK", ic: null, al: 3, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 6, s: 3 },
  { n: "JAIMON SA'AT", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 7, s: 3 },
  { n: "CELERENCE BUMI", t: "CLERK", ic: null, al: 7, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 7, s: 4 },
  { n: "MATHEUS LIUWANA", t: "CLERK", ic: null, al: 14, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 5 },
  { n: "JASMAN RUMALA", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 5 },
  { n: "SEFAN SUEMI", t: "CLERK", ic: null, al: 3, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 5 },
  { n: "JOIS GUSI SOPU", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 5 },
  { n: "NORLE BINTI SAZALI", t: "CLERK", ic: null, al: 9, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 9, s: 6 },
  { n: "DORKAS TANDY", t: "CLERK", ic: null, al: 15, mc: 19, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 9, s: 6 },
  { n: "KOREY UNDU@JOSEPH", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 10, s: 4 },
  { n: "ASERI SUAL", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 10, s: 4 },
  { n: "MOHD HAIKAL", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 10, s: 4 },
  { n: "SEBASTIANUS MITA BETEKENENG", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "JOCEL P.YOSORES", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 12, s: 7 },
  { n: "JUJIAWANAH JOLIUS", t: "CLERK", ic: null, al: 7, mc: 5, bs: null, hr: 8.65, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 33, s: 11 },
  { n: "JESILA SU KUI JIN", t: "CLERK", ic: null, al: 6, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 33, s: 11 },
  { n: "MARISSA SUPERABLE MORANTE", t: "CLERK", ic: null, al: 14, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 34, s: 12 },
  { n: "TATI BIN ARDLING", t: "CLERK", ic: null, al: 12, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 35, s: 11 },
  { n: "FERONIKA", t: "CLERK", ic: null, al: 14, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 38, s: 15 },
  { n: "MARWAN", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 18, s: 4 },
  { n: "GAMALIEL BENI", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 18, s: 4 },
  { n: "ARAIKEY SABOH", t: "CLERK", ic: null, al: 5, mc: 13, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 25, s: 4 },
  { n: "JAKE MORANTE", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 22, s: 4 },
  { n: "ANDY SANDY", t: "CLERK", ic: null, al: 10, mc: 17, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 22, s: 4 },
  { n: "BRIANWARE", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 21, s: 4 },
  { n: "HASBI", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 21, s: 4 },
  { n: "MARGARETHA BEGAN", t: "CLERK", ic: null, al: 15, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 19, s: 4 },
  { n: "JUSTUS JELLABING", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 10, s: 4 },
  { n: "REMAMBER ANDAPAN", t: "CLERK", ic: null, al: 1, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "ERIK BIN UNDU", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "ASRUL KIRMAN", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "JUSPENDY JULISIP", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 26, s: 4 },
  { n: "FIFI POLCE", t: "CLERK", ic: null, al: 8, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "RUSNI BAHARI", t: "CLERK", ic: null, al: 6, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 27, s: 4 },
  { n: "MUHAMMAD YUSUF KALLA", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 20, s: 4 },
  { n: "CRVEEN KIMSUN", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 23, s: 4 },
  { n: "FERDY ARDIANSYAH", t: "CLERK", ic: null, al: 11, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 23, s: 4 },
  { n: "SURJAINI SUARDI", t: "CLERK", ic: null, al: 15, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 23, s: 4 },
  { n: "BENEDIKTUS BIN BANI", t: "CLERK", ic: null, al: 14, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 17, s: 4 },
  { n: "HENDRIKUS BIN PATI", t: "CLERK", ic: null, al: 11, mc: 22, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 14, s: 4 },
  { n: "MUHAMMAD AYYUB", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 15, s: 4 },
  { n: "MOHD ASMI", t: "CLERK", ic: null, al: 1, mc: 6, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 15, s: 4 },
  { n: "JERANNYIS BIN ABIDIN", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "IGNASIUS LABA", t: "CLERK", ic: null, al: 9, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "MASKUR", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "REA VANESSA BAMBALAN", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 16, s: 4 },
  { n: "FRENCIS TALIB", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 17, s: 4 },
  { n: "RIANTO PAPPANG", t: "CLERK", ic: null, al: 2, mc: 12, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 17, s: 4 },
  { n: "LATING LAI BETEQ", t: "CLERK", ic: null, al: 9, mc: 18, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 18, s: 4 },
  { n: "AMIRUL", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 18, s: 4 },
  { n: "ROSALINDA LAMBER", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 19, s: 4 },
  { n: "THRESYANA ALI", t: "CLERK", ic: null, al: 11, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 19, s: 4 },
  { n: "ASWAN BIN UMAR", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 20, s: 4 },
  { n: "ANDRIANUS DEMON", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 20, s: 4 },
  { n: "JERREMY NUEH", t: "CLERK", ic: null, al: 4, mc: 13, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 37, s: 14 },
  { n: "KRISTIAN EBIT", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 21, s: 4 },
  { n: "JAMAL BIN BALEHA", t: "CLERK", ic: null, al: 16, mc: 21, bs: null, hr: 9, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 22, s: 4 },
  { n: "DERRIN MIRIH", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 22, s: 4 },
  { n: "VERRA RHI", t: "CLERK", ic: null, al: 13, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 23, s: 4 },
  { n: "SANLY SANDY", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 23, s: 4 },
  { n: "SAGARIO", t: "CLERK", ic: null, al: 7, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "WEDNESDAY", p: 1, s: 1 },
  { n: "SARIL", t: "CLERK", ic: null, al: 9, mc: 18, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 1, s: 1 },
  { n: "MOHD NASIR BIN BASRI", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "THURSDAY", p: 1, s: 1 },
  { n: "ASRI BIN AZIZ", t: "CLERK", ic: null, al: 14, mc: 14, bs: null, hr: 9.5, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 1, s: 1 },
  { n: "DARWIN MORANTE", t: "CLERK", ic: null, al: 14, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "WEDNESDAY", p: 1, s: 1 },
  { n: "ASRUL BIN ASI", t: "CLERK", ic: null, al: 10, mc: 18, bs: null, hr: 9.5, bt: "NORMAL", no: "f", rd: "WEDNESDAY", p: 1, s: 1 },
  { n: "AHMAD NUH", t: "CLERK", ic: null, al: 1, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "THURSDAY", p: 1, s: 1 },
  { n: "ANNDY AHMAD", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 1, s: 1 },
  { n: "HABIBI", t: "CLERK", ic: null, al: 15, mc: 22, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "THURSDAY", p: 1, s: 1 },
  { n: "AMRAN BIN SUKARDI", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "MONDAY", p: 1, s: 1 },
  { n: "EMMANUEL LLANOS", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 9.5, bt: "NORMAL", no: "f", rd: "WEDNESDAY", p: 2, s: 1 },
  { n: "JIEFHER C.ASO", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 7.5, bt: "NORMAL", no: "f", rd: "TUESDAY", p: 3, s: 1 },
  { n: "RIPAL", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 1, s: 1 },
  { n: "ANDRESON YINSUN", t: "CLERK", ic: null, al: 2, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 1, s: 1 },
  { n: "MICHAEL S.OBREGON", t: "CLERK", ic: null, al: 15, mc: 18, bs: null, hr: 9.5, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 1, s: 1 },
  { n: "KHAIRUL BIN KIRMAN", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 11, s: 4 },
  { n: "BENEDIKTUS RIKI", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 4 },
  { n: "ANDY AHMAD", t: "CLERK", ic: null, al: 0, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "FRIDAY", p: 1, s: 1 },
  { n: "BERNADUS RIKI", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 8, s: 4 },
  { n: "KHAIRUL NIJAM", t: "CLERK", ic: null, al: 8, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 20, s: 4 },
  { n: "MOLIADI", t: "CLERK", ic: null, al: 4, mc: 14, bs: null, hr: 8.2, bt: "NORMAL", no: "f", rd: "SUNDAY", p: 13, s: 4 },
];

const restdayMap = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

const breakTypeMap = { NORMAL: "1h", TWO_HOUR: "2h" } as const;

async function resolveAreaId(): Promise<number> {
  const arg = process.argv[2] ? Number(process.argv[2]) : null;
  if (arg !== null) return arg;
  const [first] = await db
    .select({ id: schema.areas.id })
    .from(schema.areas)
    .where(isNull(schema.areas.deletedAt))
    .orderBy(schema.areas.id)
    .limit(1);
  if (!first) {
    throw new Error("No area found. Pass areaId: tsx db/seed-import.ts <areaId>");
  }
  return first.id;
}

async function seedPositions(areaId: number) {
  const map = new Map<number, number>();
  for (const p of positions) {
    const [existing] = await db
      .select({ id: schema.positions.id })
      .from(schema.positions)
      .where(
        and(
          eq(schema.positions.name, p.name),
          eq(schema.positions.areaId, areaId),
          isNull(schema.positions.deletedAt),
        ),
      )
      .limit(1);
    if (existing) {
      map.set(p.id, existing.id);
      continue;
    }
    const [inserted] = await db
      .insert(schema.positions)
      .values({ name: p.name, areaId })
      .returning({ id: schema.positions.id });
    map.set(p.id, inserted.id);
  }
  return map;
}

async function seedDepartments(areaId: number) {
  const map = new Map<number, number>();
  for (const s of stations) {
    const [existing] = await db
      .select({ id: schema.departments.id })
      .from(schema.departments)
      .where(
        and(
          eq(schema.departments.name, s.name),
          eq(schema.departments.areaId, areaId),
          isNull(schema.departments.deletedAt),
        ),
      )
      .limit(1);
    if (existing) {
      map.set(s.id, existing.id);
      continue;
    }
    const [inserted] = await db
      .insert(schema.departments)
      .values({ name: s.name, areaId })
      .returning({ id: schema.departments.id });
    map.set(s.id, inserted.id);
  }
  return map;
}

async function seedEmployees(
  areaId: number,
  posMap: Map<number, number>,
  depMap: Map<number, number>,
) {
  let inserted = 0;
  let skipped = 0;
  for (const r of employeesData) {
    const [dup] = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.name, r.n),
          eq(schema.employees.areaId, areaId),
          isNull(schema.employees.deletedAt),
        ),
      )
      .limit(1);
    if (dup) {
      skipped++;
      continue;
    }
    const isMonthly = r.t === "STAFF";
    await db.insert(schema.employees).values({
      areaId,
      name: r.n,
      ic: r.ic,
      positionId: posMap.get(r.p) ?? null,
      departmentId: depMap.get(r.s) ?? null,
      restday: [restdayMap[r.rd]],
      breakType: breakTypeMap[r.bt],
      totalAnnualLeave: r.al,
      totalSickLeave: r.mc,
      hasOvertime: r.no === "f",
      salaryType: isMonthly ? "monthly" : "hour",
      salaryMonth: isMonthly ? r.bs : null,
      salaryHour: isMonthly ? null : r.hr,
    });
    inserted++;
  }
  return { inserted, skipped };
}

async function main() {
  const areaId = await resolveAreaId();
  console.log(`Importing into areaId=${areaId}`);

  console.log(`Positions: ${positions.length}`);
  const posMap = await seedPositions(areaId);

  console.log(`Departments (stations): ${stations.length}`);
  const depMap = await seedDepartments(areaId);

  console.log(`Employees: ${employeesData.length}`);
  const r = await seedEmployees(areaId, posMap, depMap);

  console.log(
    `Done. employees inserted=${r.inserted}, skipped(existing)=${r.skipped}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
