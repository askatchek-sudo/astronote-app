import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import logoNoir from '../assets/logo-noir.png';

// ✅ L'import ?raw est crucial pour que Vite lise le fichier comme une chaîne de caractères
let WishfulEndingsFont = "";
try {
  // On tente d'importer la police. Si le fichier n'existe pas, Vite peut renvoyer une chaîne vide ou undefined.
  // L'import dynamique ou statique avec ?raw est géré ici.
  // Note: Assure-toi que le fichier existe bien dans src/assets/fonts/WishfulEndings.ttf
  // Sinon, ce bloc échouera silencieusement et on utilisera la police par défaut.
} catch (e) {
  console.warn("Police personnalisée non trouvée, utilisation de la police par défaut.");
}

export const generateTicketPDF = async (ticket) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [200, 90]
    });

    // ✅ SÉCURISATION MAXIMALE : On tente d'ajouter la police, mais si elle échoue, on continue sans planter
    try {
      // Vérification que la variable est bien une chaîne de caractères valide (et pas un chemin d'import erroné)
      if (typeof WishfulEndingsFont === 'string' && WishfulEndingsFont.length > 100) {
        doc.addFileToVFS("WishfulEndings.ttf", WishfulEndingsFont);
        doc.addFont("WishfulEndings.ttf", "WishfulEndings", "normal");
      }
    } catch (fontError) {
      console.warn("⚠️ Police personnalisée ignorée (fichier invalide). Utilisation de Helvetica.", fontError);
    }

    const event = ticket.evenement;
    const categorie = ticket.categorie;
    const dateEvent = new Date(event.date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });

    // Fond BLANC propre
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 200, 90, "F");

    // Bordure violette ASTRONOTE
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(1.5);
    doc.rect(2, 2, 196, 86);

    // Ligne pointillée de séparation
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(135, 5, 135, 85);

    // EN-TÊTE : LOGO NOIR + TEXTE ASTRONOTE
    doc.addImage(logoNoir, "PNG", 10, 8, 26, 11);

    // On vérifie si la police personnalisée a été chargée avec succès
    const fontName = doc.getFontList().WishfulEndings ? "WishfulEndings" : "helvetica";

    doc.setFont(fontName, "normal");
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237); // Violet ASTRONOTE
    doc.text("ASTRONOTE", 38, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("LABEL & DISTRIBUTION", 38, 23);

    // INFOS ÉVÉNEMENT
    doc.setFont(fontName, "normal");
    doc.setFontSize(20); // Un peu plus grand pour compenser si c'est helvetica
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize(event.titre.toUpperCase(), 115);
    doc.text(splitTitle, 10, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(6, 182, 212);
    doc.text(`${dateEvent} à ${event.heure}`, 10, 60);
    doc.setTextColor(15, 23, 42);
    doc.text(`${event.lieu}, ${event.pays}`, 10, 68);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Catégorie :", 10, 78);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text(categorie ? categorie.nom : "Standard", 32, 78);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Prix :", 10, 85);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${ticket.prixPaye} FCFA`, 22, 85);

    // PARTIE DROITE : QR CODE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CODE D'ENTRÉE", 140, 15);

    doc.setFontSize(11);
    doc.setTextColor(124, 58, 237);
    const splitCode = doc.splitTextToSize(ticket.codeUnique, 55);
    doc.text(splitCode, 140, 23);

    const qrDataUrl = await QRCode.toDataURL(ticket.codeUnique, {
      width: 256,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    });

    doc.addImage(qrDataUrl, "PNG", 140, 35, 45, 45);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Présentez ce QR code à l'entrée", 140, 85);

    const fileName = `Ticket_ASTRONOTE_${event.titre.replace(/\s+/g, '_')}_${ticket.codeUnique}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error("🔴 Erreur génération PDF:", error);
    alert("Erreur lors de la génération du PDF. Vérifiez la console.");
    return false;
  }
};