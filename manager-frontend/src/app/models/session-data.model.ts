import { Ontologyconstants } from '../components/constants/ontologyconstants';

export class SessionData {
  [key: string]: any;

  constructor(uid: string, sessionId: string) {
    const constants = new Ontologyconstants();
    this[constants.UID] = uid;
    this[constants.SessionId] = sessionId;
    this[constants.DateCreated] = new Date().toISOString();
    this[constants.SessionData] = constants.SessionData; // Catalog type
    this[constants.dctermsidentifier] = constants.SessionData; // Identify the class
  }
}
