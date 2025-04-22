1. pridat vic moznych params na generaci heatmapy
    - interval: týdenní / měsíční
    - providers: GitHub, GitLab, Bitbucket…
    - events: commit, PR, merge, issue, comment
    - aggregation: count, weighted (např. podle velikosti diffů), custom metric
    - cell_size: malé/střední/velké
    - show_labels: ano/ne (číslování dnů, týdnů, měsíců)
    možnost zadat vlastní JSON/CSV datový vstup pro offline generování

2. Drill‑down: kliknutím na buňku zobrazit seznam commitů/events
    - na <rect> (SVG) nebo buňku (v iframe) naslouchat onclick

3. Tooltip s detaily: autor, zpráva, odkaz na PR/issue
4. Zoom na libovolné časové období (např. výběr šipkou myši) ???
5. Statický obrázek nebo PDF heatmapy pro vkládání do prezentací či Readme
    - Export formáty

    SVG → PNG (client‑side, canvas.toBlob())

    SVG → PDF (server‑side s pdfkit nebo puppeteer)
6. Vytvorit CLI appku na generaci