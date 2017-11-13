var Backbone = require('backbone');
var autobahn = require('autobahn');

var Chart = Backbone.View.extend({
  initialize: function(data, el) {
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
    var svgWidth = 1000;
    return (x / this.getX().max * (svgWidth));
  },

  getSvgY: function(y) {
    // const {svgHeight, xLabelSize} = this.props;
    var svgHeight = 500;
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
    // console.log(this);
    document.getElementById(this.el).innerHTML = "<path class='linechart_path' d='" + this.makePath() + "' />";
    document.getElementById(this.el).innerHTML += "<path class='linechart_area' d='" + this.makeArea() + "' />";
    document.getElementById(this.el).innerHTML += "<circle class='circle' r='5' cx='-100' cy='-100' />";
    document.getElementById(this.el).innerHTML += "<line class='line' x1='-40' y1='-8' x2='-40' y2='500' />";
    document.getElementById(this.el).innerHTML += "<text transform='translate(-20, 20)' textAnchor='middle'>$"+Math.round(this.getY().max)+"</text>";
    document.getElementById(this.el).innerHTML += "<text transform='translate(-20, 480)' textAnchor='middle'>$"+Math.round(this.getY().min)+"</text>";

    document.getElementById(this.el).innerHTML += "<text transform='translate(0, 520)' textAnchor='middle'>"+this.makeDate(this.unfilitered[0].date, true)+"</text>";
    document.getElementById(this.el).innerHTML += "<text transform='translate(935, 520)' textAnchor='middle'>"+this.makeDate(this.unfilitered[this.unfilitered.length - 1].date, false)+"</text>";

    document.getElementById(this.el).onmousemove = (e) => {
      var global = Function("return this")();
      // console.log(global);
      var data = this.data;
      var unfiltered = this.unfilitered;
      // const {svgWidth, data, yLabelSize} = this.props;
      var svgWidth = 1000;
      const svgLocation = document.getElementsByClassName("linechart")[0].getBoundingClientRect();
      const adjustment = (svgLocation.width - svgWidth) / 2; //takes padding into consideration
      const relativeLoc = e.clientX - svgLocation.left - adjustment;
      // console.log(this);
      // console.log(global.g.data);
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
      if(relativeLoc - yLabelSize < 0){
        // this.stopHover();
      } else {
        // console.log('out');
        this.state = {
          hoverLoc: relativeLoc,
          activePoint: closestPoint
        }
        // console.log(closestPoint);
        document.getElementsByClassName('circle')[0].setAttribute('cx', closestPoint.svgX);
        document.getElementsByClassName('circle')[0].setAttribute('cy', closestPoint.svgY);
        document.getElementsByClassName('line')[0].setAttribute('x1', relativeLoc);
        document.getElementsByClassName('line')[0].setAttribute('x2', relativeLoc);
        if (relativeLoc < 985 && relativeLoc > 15)
          $('.curprice').css('margin-left', relativeLoc - 25);
        // console.log(closestPoint);
        $('.curprice').text(closestPoint.price);
        // this.props.onChartHover(relativeLoc, closestPoint);
      }
    };

    document.getElementById(this.el).onmouseenter = () => {
      // console.log(this);
      var global = Function("return this")();
      // console.log(global);
      this.show('circle');
      this.show('line');
      $('.curprice').show();
    };

    document.getElementById(this.el).onmouseleave = (e) => {
      var global = Function("return this")();
      this.hide('circle');
      this.hide('line');
      $('.curprice').text('');
    };
  }
});

$(function() {
  $.ajax({
    url: 'https://coincap.io/history/365day/BTC',
    success: function(data) {
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
        'graph');
      chart.render();
    },
    error: function() {
      console.log('err');
    }
  });
});
