class Buffer {

    spaceBetweenFrames = 10;
    frames = [];
    outputFrame = null;

    constructor(two, bufferSize, x, y, frameSize) {

        // Calcola la larghezza totale di tutti i frame, con lo spazio tra un frame e l'altro 
        var totalWidth = bufferSize*frameSize + (bufferSize - 1)*this.spaceBetweenFrames;

        // Posizione del primo frame
        var framePosition = x - totalWidth/2 + frameSize/2;
        
        for (var i = 0; i < bufferSize; i++) {
            
            // Crea il frame
            var newFrame = new Frame(two, framePosition, y, frameSize, "white", null)

            // Se e' l'ultimo frame, ovvero il frame di output, scrivici sopra "Output frame"
            if (i == bufferSize - 1) {
                this.outputFrame = newFrame;
                var txt = two.makeText("Output frame", framePosition, y - frameSize/2 - 10, fontStyleSmallBlack);
                txt.alignment = "center";
            }

            // Aggiungi il frame alla lista
            this.frames.push(newFrame);

            // Prepara posiz per il prossimo frame aggiungendo la misura di un frame + lo spazio
            framePosition += frameSize + this.spaceBetweenFrames;
        }
    }

}