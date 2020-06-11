import { eventService } from "./EventService";

class LoggingService {

  print(data, type) {
    eventService.publishLog(data, type);
  }

}

const loggingService = new LoggingService();
export const print = loggingService.print.bind(loggingService);
