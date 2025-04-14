export function getColor(count: number, darkMode: boolean): string {
    if (!darkMode) {
      if (count === 0) return "#F3E5F5";   
      if (count < 3) return "#CE93D8";       
      if (count < 6) return "#AB47BC";       
      if (count < 10) return "#8E24AA";      
      return "#6A1B9A";                    
    } else {
      if (count === 0) return "#3A3A3A";     
      if (count < 3) return "#6A1B9A";       
      if (count < 6) return "#7B1FA2";       
      if (count < 10) return "#8E24AA";      
      return "#9C27B0";                    
    }
  }