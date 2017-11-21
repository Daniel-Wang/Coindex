var Backbone = require('backbone');
var autobahn = require('autobahn');

var Chart = Backbone.View.extend({
  initialize: function(data, el, w, h) {
    this.svgWidth = parseInt(w);
    this.svgHeight = parseInt(h);

    var filteredData = [];
    this.unfilitered = data;

    for(var i=0;i<data.length;++i) {
      filteredData[i] = [data[i].x, data[i].y];
    }

    this.data = filteredData;
    this.el = el;
    this.state = {
      hoverLoc: null,
      activePoint: null
    };
  },

  getX: function() {
    return {
      min: this.data[0][0],
      max: this.data[this.data.length - 1][0]
    }
  },

  getY: function() {
    var min = 99999999999;
    var max = -99999999999;
    for (var i = 0;i < this.data.length; ++i) {
      if (this.data[i][1] > max)
        max = this.data[i][1];

      if (this.data[i][1] < min)
        min = this.data[i][1];
    }

    return {
      min: min,
      max: max
    }
  },

  getSvgX: function(x) {
    return (x / this.getX().max * (this.svgWidth));
  },

  getSvgY: function(y) {
    var svgHeight = this.svgHeight;
    const gY = this.getY();
    return ((svgHeight) * gY.max - (svgHeight) * y) / (gY.max - gY.min);
  },

  makePath: function() {
    let pathD = 'M' + this.getSvgX(this.data[0][0]) + ' ' + this.getSvgY(this.data[0][1]) + ' ';

    pathD += this.data.map((point, i) => {
      return 'L' + this.getSvgX(point[0]) + ' ' + this.getSvgY(point[1]) + ' ';
    });

    return pathD;
  },

  makeArea: function() {
    let pathD = "M " + this.getSvgX(this.data[0][0]) + " " + this.getSvgY(this.data[0][1]) + " ";

    pathD += this.data.map((point, i) => {
      return "L " + this.getSvgX(point[0]) + " " + this.getSvgY(point[1]) + " ";
    });

    const x = this.getX();
    const y = this.getY();
    pathD += "L " + this.getSvgX(x.max) + " " + this.getSvgY(y.min) + " "
    + "L " + this.getSvgX(x.min) + " " + this.getSvgY(y.min) + " ";

    return pathD;
  },

  makeLabel: function() {

  },

  show: function(el) {
    var x = document.getElementsByClassName(el)[0];
    x.style.display = "block";
  },

  hide: function(el) {
    var x = document.getElementsByClassName(el)[0];
    x.style.display = "none";
  },

  makeDate: function(d, p) {
    var t = new Date(d);
    var months = new Array("Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec");
    return t.getDate() + " " + months[t.getMonth()] + (p ? " " + t.getFullYear() : "");
  },

  makeCurPrice: function() {

  },

  render: function() {
    document.getElementById(this.el).innerHTML = "<path class='linechart_path' d='" + this.makePath() + "' />";
    document.getElementById(this.el).innerHTML += "<path class='linechart_area' d='" + this.makeArea() + "' />";
    document.getElementById(this.el).innerHTML += "<circle class='circle' r='5' cx='-100' cy='-100' />";
    document.getElementById(this.el).innerHTML += "<line class='line' x1='-40' y1='0' x2='-40' y2='"+this.svgHeight+"' />";
    document.getElementById(this.el).innerHTML += "<text font-family='Helvetica' font-size='12' fill='#B4B4B4' transform='translate(-20, 20)' textAnchor='middle'>$"+Math.round(this.getY().max)+"</text>";
    document.getElementById(this.el).innerHTML += "<text font-family='Helvetica' font-size='12' fill='#B4B4B4' transform='translate(-20, " + parseInt(this.svgHeight - 20) +")' textAnchor='middle'>$"+Math.round(this.getY().min)+"</text>";
    document.getElementById(this.el).innerHTML += "<text font-family='Helvetica' font-size='12' fill='#B4B4B4' transform='translate(0, "+ parseInt(this.svgHeight + 20) + ")' textAnchor='middle'>"+this.makeDate(this.unfilitered[0].date, true)+"</text>";
    document.getElementById(this.el).innerHTML += "<text font-family='Helvetica' font-size='12' fill='#B4B4B4' transform='translate(" + parseInt(this.svgWidth - 65) + ", "+ parseInt(this.svgHeight + 20) +")' textAnchor='middle'>"+this.makeDate(this.unfilitered[this.unfilitered.length - 1].date, false)+"</text>";

    document.getElementById(this.el).onmousemove = (e) => {
      var data = this.data;
      var unfiltered = this.unfilitered;

      const svgLocation = document.getElementsByClassName("linechart")[0].getBoundingClientRect();
      const adjustment = (svgLocation.width - this.svgWidth) / 2; //takes padding into consideration
      const relativeLoc = e.clientX - svgLocation.left - adjustment;

      let svgData = [];
      data.map((point, i) => {
        svgData.push({
          svgX: this.getSvgX(point[0]),
          svgY: this.getSvgY(point[1]),
          price: point[1]
        });
      });

      let closestPoint = {};
      for(let i = 0, c = 500; i < svgData.length; i++){
        if ( Math.abs(svgData[i].svgX - this.state.hoverLoc) <= c ){
          c = Math.abs(svgData[i].svgX - this.state.hoverLoc);
          closestPoint = svgData[i];
        }
      }
      var yLabelSize = 0;
      if (relativeLoc - yLabelSize < 0) {
        // this.stopHover();
      } else {
        this.state = {
          hoverLoc: relativeLoc,
          activePoint: closestPoint
        }

        $('.curprice').css('border', '2px solid #547AA5');
        document.getElementsByClassName('circle')[0].setAttribute('cx', closestPoint.svgX);
        document.getElementsByClassName('circle')[0].setAttribute('cy', closestPoint.svgY);
        document.getElementsByClassName('line')[0].setAttribute('x1', closestPoint.svgX);
        document.getElementsByClassName('line')[0].setAttribute('x2', closestPoint.svgX);
        if (relativeLoc < parseInt(this.svgWidth - 20) && relativeLoc > 15) {
          $('.curprice').css('margin-left', relativeLoc - 25);
        }

        $('.curprice').text(closestPoint.price);
        // this.props.onChartHover(relativeLoc, closestPoint);
      }
    };

    document.getElementById(this.el).onmouseenter = () => {
      this.show('circle');
      this.show('line');
      $('.curprice').show();
      $('.curprice').css('border', '2px solid #547AA5');
    };

    document.getElementById(this.el).onmouseleave = (e) => {
      this.hide('circle');
      this.hide('line');
      $('.curprice').text('');
      // $('.curprice').hide();
      $('.curprice').css('border', '0');
    };
  }
});

$(function() {
  $.ajax({
    url: 'https://coincap.io/history/365day/BTC',
    success: function(data) {
      console.log('constructed');
      var filteredData = [];
      for (var i=0;i<data.price.length;++i) {
        filteredData.push({
          x: i,
          y: data.price[i][1],
          date: data.price[i][0]
        })
      }

      var chart = new Chart(
        filteredData,
        'graph',
        800, 200
      );
      chart.render();
    },
    error: function() {
      console.log('err');
    }
  });
});
