library(dplyr)

fpath_file <- "exdata_2Fdata%2Fhousehold_power_consumption/household_power_consumption.txt"
df1<-read.csv(fpath_file, header=TRUE, sep=";", na.strings = "?")
df2<-subset(df1, Date %in% c("1/2/2007","2/2/2007"))
df2$Date<-as.Date(df2$Date, format="%d/%m/%Y")
df2<-cbind(df2, "DateTime"=as.POSIXct(paste(df2$Date, df2$Time)))

dev.new(width=480, height=480)
plot3<-with(df2, {
  plot(Sub_metering_1~DateTime, type="l", ylab="Energy Sub Metering", xlab="")
})
lines(df2$Sub_metering_2~df2$DateTime, col="Red")
lines(df2$Sub_metering_3~df2$DateTime, col="Blue")
legend("topright", lty=1, lwd=3, col=c("black", "red", "blue"), legend=c("Sub_metering_1", "Sub_metering_2", "Sub_metering_3"))
dev.copy(png, "plot3.png")
dev.off()