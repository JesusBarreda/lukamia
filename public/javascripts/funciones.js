function nl2br(str) {
  str = str.replace(/\n/gi, '<br/>');
  return str;
}

function bbcodeToHTML(str) {
  str = str.replace(/</gi, '&lt;');
  str = str.replace(/>/gi, '&gt;');
  str = str.replace(/\[b\](.*?)\[\/b\]/gi, '<b>$1</b>');
  str = str.replace(/\[i\](.*?)\[\/i\]/gi, '<i>$1</i>');
  str = str.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
  str = str.replace(/\[color=\"(.*?)\"\](.*?)\[\/color\]/gi, '<font color=\"$1\">$2</font>');
  str = str.replace(/\[size=\"(.*?)\"\](.*?)\[\/size\]/gi, '<font size=\"$1\">$2</font>');
  str = str.replace(/\[url\](.*?)\[\/url\]/gi, '<a href=\"$1\" class=\"enlace\" target=\"_blank\">$1</a>');
  str = str.replace(/\[url=\"(.*?)\"\](.*?)\[\/url\]/gi, '<a href=\"$1\" class=\"enlace\" target=\"_blank\">$2</a>');
  return str;
}

function getInfoBBCode() {
  var info = '<table border=\"0\" cellspacing=\"3\" cellpadding=\"3\" bgcolor=\"#FFFFFF\" width=\"100%\">' +
             ' <tr bgcolor=\"#888888\">' +
             '  <td colspan=\"2\"><font color=\"#FFFFFF\"><b>&nbsp;&nbsp;BBCode</b></font></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#EEEEEE\">' +
             '  <td>&nbsp;&nbsp;<b>C&oacute;digo</b></td>' +
             '  <td align=\"center\"><b>Visualizaci&oacute;n</b></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F8F8F8\">' +
             '  <td>&nbsp;&nbsp;[b] letra negrita [/b]</td>' +
             '  <td align=\"center\"><b>letra negrita</b></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F0F0F0\">' +
             '  <td>&nbsp;&nbsp;[i] letra cursiva [/i]</td>' +
             '  <td align=\"center\"><i>letra cursiva</i></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F8F8F8\">' +
             '  <td>&nbsp;&nbsp;[u] letra subrayada [/u]</td>' +
             '  <td align=\"center\"><u>letra subrayada</u></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F0F0F0\">' +
             '  <td>&nbsp;&nbsp;[color=\"red\"] color rojo [/color]</td>' +
             '  <td align=\"center\"><font color=\"red\">color rojo</font></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F8F8F8\">' +
             '  <td>&nbsp;&nbsp;[size=\"3\"] letra de tama&ntilde;o 3 [/size]</td>' +
             '  <td align=\"center\"><font size=\"3\">letra de tama&ntilde;o 3</font></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F0F0F0\">' +
             '  <td>&nbsp;&nbsp;[url] http://www.google.es [/url]</td>' +
             '  <td align=\"center\"><a href=\"http://www.google.es\" class=\"enlace\" target=\"_blank\">http://www.google.es</a></td>' +
             ' </tr>' +
             ' <tr bgcolor=\"#F8F8F8\">' +
             '  <td>&nbsp;&nbsp;[url=\"http://www.google.es\"] Google [/url]</td>' +
             '  <td align=\"center\"><a href=\"http://www.google.es\" class=\"enlace\" target=\"_blank\">Google</a></td>' +
             ' </tr>' +
             '</table>';
  return info;
}

function esNumero(num) {
  var nNum = new Number(num);
  if('' + nNum == 'NaN') {
    return false;
  }
  else {
    return true;
  }
}

function emailCorrecto(email) {
  var emailReg = /^([\da-zA-Z_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})$/;
  if(!emailReg.test(email)) {
    return false;
  }
  else {
    return true;
  }
}
