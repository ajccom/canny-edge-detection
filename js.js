"use strict"
void function (isDebug) {
	var app = {
    setImg: function (src) {
      if (!src) {return}
      this.ctx = document.getElementById('canvas').getContext('2d');
      
      this.w = 200;
      this.h = 200;
      
      var img = new Image();
      img.onload = function () {
        document.getElementById('canvas2').getContext('2d').drawImage(img, 0, 0);
        app.ctx.drawImage(img, 0, 0);
        app.data = app.ctx.getImageData(0, 0, app.w, app.h);
        app.draw();
      }
      img.src = src;
    },
    draw: function () {
      //set gray image
      this.grayImage();
      
      //edge-detection
      this.detect(0.80, 0.55);
      
    },
    grayImage: function () {
      var d = this.data.data,
          w = this.w,
          h = this.h,
          i = 0,
          l = w * h,
          v = 0,
          grayArray = [];
      for (i; i < l; i++) {
        v = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
        d[i * 4] = v;
        d[i * 4 + 1] = v;
        d[i * 4 + 2] = v;
        grayArray[i] = v;
      }
      this.grayArray = grayArray;
      this.ctx.putImageData(this.data, 0, 0);
    },
    detect: function (high, low) {
      //code from http://blog.csdn.net/likezhaobin/article/details/6892629

      var nSigma = 0.4,                            //定义高斯函数的标准差  
          nWidowSize = 1+2*Math.ceil(3*nSigma),         //定义滤波窗口的大小  
          nCenter = parseInt(nWidowSize/2),                //定义滤波窗口中心的索引  
          nWidth = this.w,                             //获取图像的像素宽度  
          nHeight = this.h,                           //获取图像的像素高度  
          nImageData = this.grayArray,   //暂时保存图像中的数据  
          pCanny = [],        //为平滑后的图像数据分配内存  
          nData = [],          //两次平滑的中间数据  
          j = 0,
          i = 0;    
      var pdKernal_1 = [];    //定义一维高斯核数组  
      var dSum_1 = 0.0;                           //求和，用于进行归一化   
      var nDis;
      for(i=0; i<nWidowSize; i++)  
      {  
          nDis = i-nCenter;  
          pdKernal_1[i] = Math.exp(-(0.5)*nDis*nDis/(nSigma*nSigma))/(Math.sqrt(2*3.14159)*nSigma);  
          dSum_1 += pdKernal_1[i];  
      }  
      for(i=0; i<nWidowSize; i++)  
      {  
          pdKernal_1[i] /= dSum_1;                 //进行归一化  
      }
      var dSum, dFilter, nLimit;
      var nData = [];
      for(i=0; i<nHeight; i++)                               //进行x向的高斯滤波(加权平均)  
      {  
          for(j=0; j<nWidth; j++)  
          {  
              dSum = 0;  
              dFilter=0;                                       //滤波中间值  
              for(nLimit=Math.floor(-nCenter); nLimit<=nCenter; nLimit++)  
              {  
                  if((j+nLimit)>=0 && (j+nLimit) < nWidth )       //图像不能超出边界  
                  {  
                      dFilter += nImageData[i*nWidth+j+nLimit] * pdKernal_1[nCenter+nLimit]; 
                      dSum += pdKernal_1[nCenter+nLimit];  
                  }  
              }  
              nData[i*nWidth+j] = dFilter/dSum;  
          }  
      }  
      for(i=0; i<nWidth; i++)                                //进行y向的高斯滤波(加权平均)  
      {  
          for(j=0; j<nHeight; j++)  
          {  
              dSum = 0.0;  
              dFilter=0;  
              for(nLimit=(-nCenter); nLimit<=nCenter; nLimit++)  
              {  
                  if((j+nLimit)>=0 && (j+nLimit) < nHeight)       //图像不能超出边界  
                  {  
                      dFilter += nData[(j+nLimit)*nWidth+i] * pdKernal_1[nCenter+nLimit];  
                      dSum += pdKernal_1[nCenter+nLimit];  
                  }  
              }  
              pCanny[j*nWidth+i] = parseInt(dFilter/dSum);  
          }  
      }  
      var P = [],                 //x向偏导数  
          Q = [],                 //y向偏导数  
          M = [],                       //梯度幅值  
          Theta = [];  
      for(i=0; i<nHeight-1; i++)  
      {  
              for(j=0; j<nWidth-1; j++)  
              {  
                    P[i*nWidth+j] = (pCanny[i*nWidth + Math.min(j+1, nWidth-1)] - pCanny[i*nWidth+j] + pCanny[Math.min(i+1, nHeight-1)*nWidth+Math.min(j+1, nWidth-1)] - pCanny[Math.min(i+1, nHeight-1)*nWidth+j])/2;  
                    Q[i*nWidth+j] = (pCanny[i*nWidth+j] - pCanny[Math.min(i+1, nHeight-1)*nWidth+j] + pCanny[i*nWidth+Math.min(j+1, nWidth-1)] - pCanny[Math.min(i+1, nHeight-1)*nWidth+Math.min(j+1, nWidth-1)])/2;  
          }  
      }
      //计算梯度幅值和梯度的方向  
      for(i=0; i<nHeight; i++)  
      {  
              for(j=0; j<nWidth; j++)  
              {  
                    M[i*nWidth+j] = parseInt(Math.sqrt(P[i*nWidth+j]*P[i*nWidth+j] + Q[i*nWidth+j]*Q[i*nWidth+j])+0.5);  
                    Theta[i*nWidth+j] = Math.atan2(Q[i*nWidth+j], P[i*nWidth+j]) * 57.3;  
                    if(Theta[i*nWidth+j] < 0)  
                          Theta[i*nWidth+j] += 360;              //将这个角度转换到0~360范围  
          }  
      }
      var N = [],  //非极大值抑制结果  
          g1=0, g2=0, g3=0, g4=0;                            //用于进行插值，得到亚像素点坐标值  
      var dTmp1=0.0, dTmp2=0.0;                           //保存两个亚像素点插值得到的灰度数据  
      var dWeight=0.0;    
      for(i=0; i<nWidth; i++)  
      {  
              N[i] = 0;  
              N[(nHeight-1)*nWidth+i] = 0;  
      }  
      for(j=0; j<nHeight; j++)  
      {  
              N[j*nWidth] = 0;  
              N[j*nWidth+(nWidth-1)] = 0;  
      }    
      var nPointIdx = 0;
      for(i=1; i<nWidth-1; i++)  
      {
        for(j=1; j<nHeight-1; j++)  
        {  
          nPointIdx = i+j*nWidth;       //当前点在图像数组中的索引值  
          if(M[nPointIdx] == 0)  {N[nPointIdx] = 0;}         //如果当前梯度幅值为0，则不是局部最大对该点赋为0  
          else {  
            if(((Theta[nPointIdx]>=90)&&(Theta[nPointIdx]<135)) || ((Theta[nPointIdx]>=270)&&(Theta[nPointIdx]<315)))  
            {  
                //////根据斜率和四个中间值进行插值求解  
                g1 = M[nPointIdx-nWidth-1];  
                g2 = M[nPointIdx-nWidth];  
                g3 = M[nPointIdx+nWidth];  
                g4 = M[nPointIdx+nWidth+1];  
                dWeight = Math.abs(P[nPointIdx])/Math.abs(Q[nPointIdx]);   //反正切  
                dTmp1 = g1*dWeight+g2*(1-dWeight);  
                dTmp2 = g4*dWeight+g3*(1-dWeight);  
            } else if(((Theta[nPointIdx]>=135)&&(Theta[nPointIdx]<180)) || ((Theta[nPointIdx]>=315)&&(Theta[nPointIdx]<360)))  
            {  
                g1 = M[nPointIdx-nWidth-1];  
                g2 = M[nPointIdx-1];  
                g3 = M[nPointIdx+1];  
                g4 = M[nPointIdx+nWidth+1];  
                dWeight = Math.abs(Q[nPointIdx])/Math.abs(P[nPointIdx]);   //正切  
                dTmp1 = g2*dWeight+g1*(1-dWeight);  
                dTmp2 = g4*dWeight+g3*(1-dWeight);  
            } else if(((Theta[nPointIdx]>=45)&&(Theta[nPointIdx]<90)) || ((Theta[nPointIdx]>=225)&&(Theta[nPointIdx]<270)))  
            {  
                g1 = M[nPointIdx-nWidth];  
                g2 = M[nPointIdx-nWidth+1];  
                g3 = M[nPointIdx+nWidth];  
                g4 = M[nPointIdx+nWidth-1];  
                dWeight = Math.abs(P[nPointIdx])/Math.abs(Q[nPointIdx]);   //反正切  
                dTmp1 = g2*dWeight+g1*(1-dWeight);  
                dTmp2 = g3*dWeight+g4*(1-dWeight);  
            } else if(((Theta[nPointIdx]>=0)&&(Theta[nPointIdx]<45)) || ((Theta[nPointIdx]>=180)&&(Theta[nPointIdx]<225)))  
            {  
                g1 = M[nPointIdx-nWidth+1];  
                g2 = M[nPointIdx+1];  
                g3 = M[nPointIdx+nWidth-1];  
                g4 = M[nPointIdx-1];  
                dWeight = Math.abs(Q[nPointIdx])/Math.abs(P[nPointIdx]);   //正切  
                dTmp1 = g1*dWeight+g2*(1-dWeight);  
                dTmp2 = g3*dWeight+g4*(1-dWeight);  
            }  
          }
          if((M[nPointIdx]>=dTmp1) && (M[nPointIdx]>=dTmp2)) {
              N[nPointIdx] = 128;             
          } else  {
              N[nPointIdx] = 0;  
          }  
        }                
      }
      var nHist = [],   
          nEdgeNum = 0,             //可能边界数  
          nMaxMag = 0,          //最大梯度数  
          nHighCount; 
      for(i=0;i<1024;i++) {
        nHist[i] = 0;  
      }
      for(i=0; i<nHeight; i++)  
      {  
        for(j=0; j<nWidth; j++)  
        {  
          if(N[i*nWidth+j]==128) { 
            nHist[M[i*nWidth+j]]++;
          }
        }  
      }  
      var nEdgeNum = nHist[0];  
      var nMaxMag = 0;                    //获取最大的梯度值        
      for(i=1; i<1024; i++)           //统计经过“非最大值抑制”后有多少像素  
      {  
          if(nHist[i] != 0)       //梯度为0的点是不可能为边界点的  
          {  
              nMaxMag = i;  
          }     
          nEdgeNum += nHist[i];   //经过non-maximum suppression后有多少像素  
      } 
      var dRatHigh = high, 
          dThrHigh, dThrLow, dRatLow = low;
      nHighCount = parseInt(dRatHigh * nEdgeNum + 0.5);  
      j=1;  
      nEdgeNum = nHist[1];  
      while((j<(nMaxMag-1)) && (nEdgeNum < nHighCount))  
      {  
             j++;  
             nEdgeNum += nHist[j];  
      }  
      dThrHigh = j;                                   //高阈值  
      dThrLow = parseInt((dThrHigh) * dRatLow + 0.5);    //低阈值  
          
      var sz = {};
      sz.cx = nWidth;  
      sz.cy = nHeight;  
      for(i=0; i<nHeight; i++)  
      {  
          for(j=0; j<nWidth; j++)  
          {  
              if((N[i*nWidth+j]==128) && (M[i*nWidth+j] >= dThrHigh))  
              {  
                  N[i*nWidth+j] = 255;  
                  TraceEdge(i, j, dThrLow, N, M, sz);  
              }  
          }  
      }
      
      for(i=0; i<nHeight; i++)  
      {  
          for(j=0; j<nWidth; j++)  
          {  
              if(N[i*nWidth+j] != 255)  
              {  
                  N[i*nWidth+j]  = 0 ;   // 设置为非边界点  
              }  
          }  
      }  

      function TraceEdge ( y, x, nThrLow, pResult, pMag, sz) {
        var xNum = [1,1,0,-1,-1,-1,0,1];  
        var yNum = [0,1,1,1,0,-1,-1,-1];  
        var yy,xx,k;  
        for(k=0;k<8;k++)  
        {  
            yy = y+yNum[k];  
            xx = x+xNum[k];  
            if(pResult[yy*sz.cx+xx]==128 && pMag[yy*sz.cx+xx]>=nThrLow )  
            {  
                //该点设为边界点  
                pResult[yy*sz.cx+xx] = 255;  
                //以该点为中心再进行跟踪  
                TraceEdge(yy,xx,nThrLow,pResult,pMag,sz);  
            }  
        }  
      }
      
      var d = this.data.data,
          w = this.w,
          h = this.h,
          l = w * h;
      for (i = 0; i < l; i++) {
        d[i * 4] = N[i];
        d[i * 4 + 1] = N[i];
        d[i * 4 + 2] = N[i];
      }
      this.ctx.putImageData(this.data, 0, 0);
      
    },
    ini: function (src) {
      this.setImg(src);
    }
  };
	
	app.ini('ooo2.jpg');
	
  window.app = app;

}(false);
