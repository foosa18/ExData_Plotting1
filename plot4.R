library(dplyr)

fpath_file <- "exdata_2Fdata%2Fhousehold_power_consumption/household_power_consumption.txt"
df1<-read.csv(fpath_file, header=TRUE, sep=";", na.strings = "?")
df2<-subset(df1, Date %in% c("1/2/2007","2/2/2007"))
df2$Date<-as.Date(df2$Date, format="%d/%m/%Y")
df2<-cbind(df2, "DateTime"=as.POSIXct(paste(df2$Date, df2$Time)))

dev.new(width=480, height=480)
par(mfrow=c(2,2))
plot4<-plot(df2$Global_active_power ~ df2$DateTime, type="l", xlab="", ylab="Global Active Power")
plot(df2$Voltage ~ df2$DateTime, type="l", xlab="datetime", ylab="Voltage")

with(df2, {plot(Sub_metering_1 ~ DateTime, type="l", xlab="", ylab="Energy sub metering")})
lines(df2$Sub_metering_2 ~ df2$DateTime, col = 'Red')
lines(df2$Sub_metering_3 ~ df2$DateTime, col = 'Blue')
legend("topright", lty=1, lwd=3, col=c("black", "red", "blue"), legend=c("Sub_metering_1", "Sub_metering_2", "Sub_metering_3"))
plot(df2$Global_reactive_power ~ df2$DateTime, type="l", ylab="Global_reactive_power", xlab="datetime")
dev.copy(png, "plot4.png")
dev.off()