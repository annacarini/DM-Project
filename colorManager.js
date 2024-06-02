class ColorManager {
    
    static differenceBetweenColors(color1, color2) {
        // Dai piu' importanza alla hue, ma considera anche la luminosita'
        return Math.abs(color1[0] - color2[0]) + 0.08 * Math.abs(color1[2] - color2[2]);
    }


    static randomColor() {
        var h = Math.round(360 * Math.random());
        var s = Math.round(60 + 45 * Math.random());
        var l = Math.round(65 + 10 * Math.random());
        return [h, s, l];
    }

    
    static getDarkerColor(color) {
        // prende un colore espresso come HSL, tipo: "hsl(105, 73%, 62%)" e ne diminuisce il terzo valore, ovvero la luminosita'
        var colorArray = ColorManager.hslToArray(color);
        colorArray[1] = Math.max(0, colorArray[1]-20);  // assicuriamoci che non diventi minore di zero
        colorArray[2] = Math.max(0, colorArray[2]-16);  // assicuriamoci che non diventi minore di zero
        return ColorManager.stringifyColor(colorArray);
    }


    static stringifyColor(col) {
        return "hsl(" + col[0] + ',' + col[1] + '%,' + col[2] + '%)';
    }


    // Converte un colore nel formato stringa hsl in un array di 3 elementi
    static hslToArray(color) {
        var match = color.match(/(\d+(\.\d+)?)/g)
        const h = parseFloat(match[0]);
        const s = parseFloat(match[1]);
        const l = parseFloat(match[2]);

        return [h, s, l]
    }


    
    // Converte un colore esadecimale in un una stringa hsl
    static hexToHSL(hex) {
        // Rimuovi l'eventuale # all'inizio della stringa
        hex = hex.replace('#', '');
        
        // Estrai i valori RGB dalla stringa esadecimale
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Calcola il massimo e il minimo tra i valori RGB
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Calcola la luminosità
        var l = (max + min) / 2;
        
        let h, s;
        if (max === min) {
            // Quando il massimo è uguale al minimo, il colore è grigio
            h = 0; // La tonalità è arbitraria in questo caso
            s = 0; // La saturazione è 0 in questo caso
        } else {
            // Calcola la saturazione
            s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
            
            // Calcola la tonalità
            switch (max) {
                case r:
                    h = (g - b) / (max - min) + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / (max - min) + 2;
                    break;
                case b:
                    h = (r - g) / (max - min) + 4;
                    break;
            }
            h /= 6;
        }
        
        // Converti i valori in gradi e percentuali e restituisci la stringa HSL
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return `hsl(${h},${s}%,${l}%)`;
    }


    // Genera un nuovo colore. Dopo aver trovato tutti i colori presenti nella relazione
    // e averli convertiti nel formato array, va a creare un colore casuale e lo confronta
    // con tutti gli altri colori della relazione. Se è differente da tutti lo ritorna altrimenti
    // genera un altro colore con cui fare la comparazione. Ci prova per un massimo di 10 volte.
    static generateNewColor(colors) {
        for (var j = 0; j < colors.length; j++) {
            if (colors[j][0] == '#')
                colors[j] = ColorManager.hexToHSL(colors[j])
            colors[j] = ColorManager.hslToArray(colors[j])
        }
        var i = 0;
        var newColor = ColorManager.randomColor();
        while (i < 10) {
            var differents = 0;
            for (var color of colors) {
                if (ColorManager.differenceBetweenColors(color, newColor) > 60)
                    differents += 1
            }
            if (differents == colors.length) // Se è diverso da tutti i colori esco
                return ColorManager.stringifyColor(newColor);
            i++;
            newColor = ColorManager.randomColor();
        }
        return ColorManager.stringifyColor(newColor);
    }
}